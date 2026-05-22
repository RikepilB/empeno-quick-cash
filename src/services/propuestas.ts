import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/db/server";
import { sanitizeError, log } from "@/lib/logger";
import { rateLimitByUser } from "@/lib/rate-limit";

// ============================================================================
// Types
// ============================================================================
export type PropuestaStatus = "pending" | "accepted" | "rejected" | "expired";

export type PropuestaForClient = {
  id: string;
  solicitud_id: string;
  business: {
    id: string;
    name: string;
    district: string | null;
  };
  monto_pen: number;
  tasa_mensual: number;
  plazo_dias: number;
  status: PropuestaStatus;
  created_at: string;
  expires_at: string | null;
};

export type PropuestaForBusiness = {
  id: string;
  solicitud_id: string;
  solicitud_summary: {
    category: string;
    brand: string | null;
    model: string | null;
    district: string | null;
  };
  monto_pen: number;
  tasa_mensual: number;
  plazo_dias: number;
  status: PropuestaStatus;
  created_at: string;
  operation: {
    id: string;
    redemption_code: string;
    status: string;
    accepted_at: string;
    completed_at: string | null;
  } | null;
};

// ============================================================================
// Helpers
// ============================================================================
// Generate redemption code: EMP-XXXXX. 5-char base32 excluding ambiguous chars.
// Crypto-secure RNG so codes can't be predicted by brute-forcing PRNG state.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/1/I/O
function generateRedemptionCode(): string {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let code = "EMP-";
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

// Fetch the business owned by the current authenticated user. Throws if none.
async function getOwnerBusiness(
  supabase: ReturnType<typeof getSupabaseServer>,
  userId: string,
): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", userId)
    .single<{ id: string; name: string }>();
  if (error || !data) throw sanitizeError(error, "No tienes un negocio registrado.");
  return data;
}

// ============================================================================
// createPropuesta — business sends offer on a solicitud
// Enforces subscription quota; increments propuestas_used_this_period atomically.
// ============================================================================
const createPropuestaSchema = z.object({
  solicitud_id: z.string().uuid(),
  monto_pen: z.number().int().positive(),
  tasa_mensual: z.number().nonnegative(),
  plazo_dias: z.number().int().positive(),
  expires_at: z.string().datetime().optional(),
});

export const createPropuesta = createServerFn({ method: "POST" })
  .inputValidator(createPropuestaSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const rl = await rateLimitByUser("propuesta:create", user.id, 30, 3600);
    if (!rl.allowed) throw new Error("Demasiadas propuestas. Intenta en una hora.");

    const business = await getOwnerBusiness(supabase, user.id);

    // Fetch active or trialing subscription + plan
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, status, plan_id, propuestas_used_this_period, plans(monthly_propuestas)")
      .eq("business_id", business.id)
      .in("status", ["active", "trialing"])
      .maybeSingle<{
        id: string;
        status: string;
        plan_id: string;
        propuestas_used_this_period: number;
        plans: { monthly_propuestas: number | null } | null;
      }>();

    if (subErr) throw sanitizeError(subErr, "Error al verificar tu suscripción.");
    if (!sub) throw new Error("Tu negocio no tiene una suscripción activa.");

    const limit = sub.plans?.monthly_propuestas ?? null;
    if (limit !== null && sub.propuestas_used_this_period >= limit) {
      throw new Error(
        `Has alcanzado el límite de ${limit} propuestas de tu plan. Actualiza el plan para enviar más.`,
      );
    }

    // Insert the propuesta (RLS allows business owner)
    const { data: row, error } = await supabase
      .from("propuestas")
      .insert({
        solicitud_id: data.solicitud_id,
        business_id: business.id,
        monto_pen: data.monto_pen,
        tasa_mensual: data.tasa_mensual,
        plazo_dias: data.plazo_dias,
        expires_at: data.expires_at ?? null,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !row) throw sanitizeError(error, "Error al enviar la propuesta.");

    // Quota gate via SECURITY DEFINER RPC. Atomically increments the counter
    // and returns allowed=false when the plan limit would be exceeded. Race
    // outcome under concurrency: the second request reads allowed=false here
    // and we delete its insert so the counter pegs at the cap.
    const { data: incRows, error: incErr } = await supabase
      .rpc("increment_propuestas_used")
      .returns<{ used: number; allowed: boolean }[]>();
    const incRow = Array.isArray(incRows)
      ? incRows[0]
      : (incRows as { used: number; allowed: boolean } | null);
    const denied = !!incErr || !incRow || incRow.allowed === false;

    if (denied) {
      const { error: delErr } = await supabase.from("propuestas").delete().eq("id", row.id);
      if (delErr) {
        log.warn("rollback propuesta failed after quota deny", { error: delErr.message });
      }
      throw new Error("Has alcanzado el límite de propuestas de tu plan.");
    }

    return { id: row.id };
  });

// ============================================================================
// listPropuestasForSolicitud — client viewing offers on their own solicitud
// ============================================================================
const listPropuestasSchema = z.object({ solicitud_id: z.string().uuid() });

export const listPropuestasForSolicitud = createServerFn({ method: "GET" })
  .inputValidator(listPropuestasSchema)
  .handler(async ({ data }): Promise<PropuestaForClient[]> => {
    const supabase = getSupabaseServer();

    const { data: rows, error } = await supabase
      .from("propuestas")
      .select(
        "id, solicitud_id, monto_pen, tasa_mensual, plazo_dias, status, created_at, expires_at, businesses(id, name, district)",
      )
      .eq("solicitud_id", data.solicitud_id)
      .order("monto_pen", { ascending: false });

    if (error) throw sanitizeError(error, "Error al cargar las propuestas.");

    type PropuestaListRow = {
      id: string;
      solicitud_id: string;
      monto_pen: number;
      tasa_mensual: number | string;
      plazo_dias: number;
      status: PropuestaStatus;
      created_at: string;
      expires_at: string | null;
      businesses: { id: string; name: string; district: string | null } | null;
    };
    const typedRows = (rows ?? []) as unknown as PropuestaListRow[];
    return typedRows.map((r) => ({
      id: r.id,
      solicitud_id: r.solicitud_id,
      business: {
        id: r.businesses?.id ?? "",
        name: r.businesses?.name ?? "Negocio",
        district: r.businesses?.district ?? null,
      },
      monto_pen: r.monto_pen,
      tasa_mensual: Number(r.tasa_mensual),
      plazo_dias: r.plazo_dias,
      status: r.status,
      created_at: r.created_at,
      expires_at: r.expires_at,
    }));
  });

// ============================================================================
// getPropuestaForClient — single propuesta detail, used by client deep-link
// RLS ensures only the owning client can read.
// ============================================================================
const getPropuestaSchema = z.object({ propuesta_id: z.string().uuid() });

export const getPropuestaForClient = createServerFn({ method: "GET" })
  .inputValidator(getPropuestaSchema)
  .handler(async ({ data }): Promise<PropuestaForClient | null> => {
    const supabase = getSupabaseServer();
    const { data: row, error } = await supabase
      .from("propuestas")
      .select(
        "id, solicitud_id, monto_pen, tasa_mensual, plazo_dias, status, created_at, expires_at, businesses(id, name, district)",
      )
      .eq("id", data.propuesta_id)
      .maybeSingle();
    if (error) throw sanitizeError(error, "Error al cargar las propuestas.");
    if (!row) return null;
    type PropuestaSingleRow = {
      id: string;
      solicitud_id: string;
      monto_pen: number;
      tasa_mensual: number | string;
      plazo_dias: number;
      status: PropuestaStatus;
      created_at: string;
      expires_at: string | null;
      businesses: { id: string; name: string; district: string | null } | null;
    };
    const r = row as unknown as PropuestaSingleRow;
    return {
      id: r.id,
      solicitud_id: r.solicitud_id,
      business: {
        id: r.businesses?.id ?? "",
        name: r.businesses?.name ?? "Negocio",
        district: r.businesses?.district ?? null,
      },
      monto_pen: r.monto_pen,
      tasa_mensual: Number(r.tasa_mensual),
      plazo_dias: r.plazo_dias,
      status: r.status,
      created_at: r.created_at,
      expires_at: r.expires_at,
    };
  });

// ============================================================================
// listMyPropuestas — business viewing their own outgoing offers
// ============================================================================
export const listMyPropuestas = createServerFn({ method: "GET" }).handler(
  async (): Promise<PropuestaForBusiness[]> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const business = await getOwnerBusiness(supabase, user.id);

    const { data: rows, error } = await supabase
      .from("propuestas")
      .select(
        `
        id,
        solicitud_id,
        monto_pen,
        tasa_mensual,
        plazo_dias,
        status,
        created_at,
        solicitudes(category, brand, model, district),
        operations(id, redemption_code, status, accepted_at, completed_at)
      `,
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) throw sanitizeError(error, "Error al cargar las propuestas.");

    type SolicitudJoin = {
      category: string;
      brand: string | null;
      model: string | null;
      district: string | null;
    };
    type OperationJoin = {
      id: string;
      redemption_code: string;
      status: string;
      accepted_at: string;
      completed_at: string | null;
    };
    type MyPropuestaRow = {
      id: string;
      solicitud_id: string;
      monto_pen: number;
      tasa_mensual: number | string;
      plazo_dias: number;
      status: PropuestaStatus;
      created_at: string;
      solicitudes: SolicitudJoin | SolicitudJoin[] | null;
      operations: OperationJoin | OperationJoin[] | null;
    };
    const typedRows = (rows ?? []) as unknown as MyPropuestaRow[];
    return typedRows.map((r) => {
      const sol = Array.isArray(r.solicitudes) ? r.solicitudes[0] : r.solicitudes;
      const opRaw = Array.isArray(r.operations) ? r.operations[0] : r.operations;
      return {
        id: r.id,
        solicitud_id: r.solicitud_id,
        solicitud_summary: {
          category: sol?.category ?? "",
          brand: sol?.brand ?? null,
          model: sol?.model ?? null,
          district: sol?.district ?? null,
        },
        monto_pen: r.monto_pen,
        tasa_mensual: Number(r.tasa_mensual),
        plazo_dias: r.plazo_dias,
        status: r.status,
        created_at: r.created_at,
        operation: opRaw
          ? {
              id: opRaw.id,
              redemption_code: opRaw.redemption_code,
              status: opRaw.status,
              accepted_at: opRaw.accepted_at,
              completed_at: opRaw.completed_at,
            }
          : null,
      };
    });
  },
);

// ============================================================================
// acceptPropuesta — client accepts an offer. Uses accept_propuesta RPC.
// ============================================================================
const acceptSchema = z.object({ propuesta_id: z.string().uuid() });

export const acceptPropuesta = createServerFn({ method: "POST" })
  .inputValidator(acceptSchema)
  .handler(
    async ({
      data,
    }): Promise<{
      operation_id: string;
      redemption_code: string;
      propuesta_id: string;
    }> => {
      const supabase = getSupabaseServer();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const rl = await rateLimitByUser("propuesta:accept", user.id, 10, 3600);
      if (!rl.allowed) throw new Error("Demasiados intentos. Intenta en una hora.");

      const redemptionCode = generateRedemptionCode();

      const { data: op, error } = await supabase.rpc("accept_propuesta", {
        p_propuesta_id: data.propuesta_id,
        p_redemption_code: redemptionCode,
      });

      if (error) throw sanitizeError(error, "Error al aceptar la propuesta.");
      if (!op) throw new Error("Error al aceptar la propuesta.");

      const row = op as {
        id: string;
        propuesta_id: string;
        redemption_code: string;
      };

      return {
        operation_id: row.id,
        propuesta_id: row.propuesta_id,
        redemption_code: row.redemption_code,
      };
    },
  );

// ============================================================================
// rejectPropuesta — client rejects an offer (does NOT close solicitud)
// ============================================================================
const rejectSchema = z.object({ propuesta_id: z.string().uuid() });

export const rejectPropuesta = createServerFn({ method: "POST" })
  .inputValidator(rejectSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();
    const { data: row, error } = await supabase
      .from("propuestas")
      .update({ status: "rejected" })
      .eq("id", data.propuesta_id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) throw sanitizeError(error, "Error al rechazar la propuesta.");
    if (!row) throw new Error("La propuesta ya no está pendiente.");
    return { ok: true };
  });
