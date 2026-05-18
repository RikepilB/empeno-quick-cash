import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

export type OperationStatus = "pending_pickup" | "completed" | "disputed" | "expired";

export type ClientOperation = {
  id: string;
  redemption_code: string;
  status: OperationStatus;
  accepted_at: string;
  completed_at: string | null;
  propuesta: {
    id: string;
    monto_pen: number;
    tasa_mensual: number;
    plazo_dias: number;
    business: {
      id: string;
      name: string;
      district: string | null;
    };
  };
  solicitud: {
    id: string;
    category: string;
    brand: string | null;
    model: string | null;
  };
};

export type BusinessOperation = {
  id: string;
  redemption_code: string;
  status: OperationStatus;
  accepted_at: string;
  completed_at: string | null;
  propuesta: {
    id: string;
    monto_pen: number;
    tasa_mensual: number;
    plazo_dias: number;
  };
  solicitud: {
    id: string;
    category: string;
    brand: string | null;
    model: string | null;
    district: string | null;
  };
  client_full_name: string | null;
};

// ============================================================================
// listMyOperations — client side (only their own accepted propuestas)
// ============================================================================
export const listMyClientOperations = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClientOperation[]> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // RLS (operations_client_read) restricts rows to the current client. No extra filter needed.
    const { data, error } = await supabase
      .from("operations")
      .select(
        "id, redemption_code, status, accepted_at, completed_at, " +
          "propuestas(id, monto_pen, tasa_mensual, plazo_dias, " +
          "businesses(id, name, district), " +
          "solicitudes(id, category, brand, model))",
      )
      .order("accepted_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((r: any) => ({
      id: r.id,
      redemption_code: r.redemption_code,
      status: r.status,
      accepted_at: r.accepted_at,
      completed_at: r.completed_at,
      propuesta: {
        id: r.propuestas?.id,
        monto_pen: r.propuestas?.monto_pen,
        tasa_mensual: Number(r.propuestas?.tasa_mensual),
        plazo_dias: r.propuestas?.plazo_dias,
        business: {
          id: r.propuestas?.businesses?.id ?? "",
          name: r.propuestas?.businesses?.name ?? "Negocio",
          district: r.propuestas?.businesses?.district ?? null,
        },
      },
      solicitud: {
        id: r.propuestas?.solicitudes?.id,
        category: r.propuestas?.solicitudes?.category,
        brand: r.propuestas?.solicitudes?.brand,
        model: r.propuestas?.solicitudes?.model,
      },
    }));
  },
);

// ============================================================================
// listMyBusinessOperations — business side (their own propuestas accepted)
// ============================================================================
export const listMyBusinessOperations = createServerFn({ method: "GET" }).handler(
  async (): Promise<BusinessOperation[]> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // Find business owned by user first
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!business) return [];

    // RLS (operations_business_read) restricts rows to ops for this business's propuestas.
    const { data, error } = await supabase
      .from("operations")
      .select(
        "id, redemption_code, status, accepted_at, completed_at, " +
          "propuestas(id, monto_pen, tasa_mensual, plazo_dias, business_id, " +
          "solicitudes(id, category, brand, model, district))",
      )
      .order("accepted_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((r: any) => ({
      id: r.id,
      redemption_code: r.redemption_code,
      status: r.status,
      accepted_at: r.accepted_at,
      completed_at: r.completed_at,
      propuesta: {
        id: r.propuestas?.id,
        monto_pen: r.propuestas?.monto_pen,
        tasa_mensual: Number(r.propuestas?.tasa_mensual),
        plazo_dias: r.propuestas?.plazo_dias,
      },
      solicitud: {
        id: r.propuestas?.solicitudes?.id,
        category: r.propuestas?.solicitudes?.category,
        brand: r.propuestas?.solicitudes?.brand,
        model: r.propuestas?.solicitudes?.model,
        district: r.propuestas?.solicitudes?.district,
      },
      client_full_name: null,
    }));
  },
);

// ============================================================================
// markOperationCompleted — business confirms the in-store handoff is done
// Requires the business to have already validated the redemption code in person.
// ============================================================================
const markCompletedSchema = z.object({
  operation_id: z.string().uuid(),
  redemption_code: z.string().min(1),
});

export const markOperationCompleted = createServerFn({ method: "POST" })
  .inputValidator(markCompletedSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();

    // Verify the code matches the operation (RLS already ensures we own it).
    const { data: op, error: fetchErr } = await supabase
      .from("operations")
      .select("redemption_code, status")
      .eq("id", data.operation_id)
      .single<{ redemption_code: string; status: string }>();

    if (fetchErr || !op) throw new Error("Operación no encontrada.");
    if (op.redemption_code !== data.redemption_code) {
      throw new Error("Código de redención no coincide.");
    }
    if (op.status === "completed") throw new Error("Operación ya completada.");

    const { error } = await supabase
      .from("operations")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.operation_id);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================================
// getOperationByPropuesta — fetch the operation row tied to a propuesta
// Used by client redemption-code page after accept.
// ============================================================================
const getByPropuestaSchema = z.object({ propuesta_id: z.string().uuid() });

export const getOperationByPropuesta = createServerFn({ method: "GET" })
  .inputValidator(getByPropuestaSchema)
  .handler(async ({ data }): Promise<ClientOperation | null> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // RLS restricts to ops on solicitudes owned by current client.
    const { data: row, error } = await supabase
      .from("operations")
      .select(
        "id, redemption_code, status, accepted_at, completed_at, " +
          "propuestas(id, monto_pen, tasa_mensual, plazo_dias, " +
          "businesses(id, name, district), " +
          "solicitudes(id, category, brand, model))",
      )
      .eq("propuesta_id", data.propuesta_id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return null;

    const r = row as any;
    return {
      id: r.id,
      redemption_code: r.redemption_code,
      status: r.status,
      accepted_at: r.accepted_at,
      completed_at: r.completed_at,
      propuesta: {
        id: r.propuestas?.id,
        monto_pen: r.propuestas?.monto_pen,
        tasa_mensual: Number(r.propuestas?.tasa_mensual),
        plazo_dias: r.propuestas?.plazo_dias,
        business: {
          id: r.propuestas?.businesses?.id ?? "",
          name: r.propuestas?.businesses?.name ?? "Negocio",
          district: r.propuestas?.businesses?.district ?? null,
        },
      },
      solicitud: {
        id: r.propuestas?.solicitudes?.id,
        category: r.propuestas?.solicitudes?.category,
        brand: r.propuestas?.solicitudes?.brand,
        model: r.propuestas?.solicitudes?.model,
      },
    };
  });
