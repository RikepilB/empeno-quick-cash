import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/db/server";
import { sanitizeError, log } from "@/lib/logger";
import { rateLimitByUser } from "@/lib/rate-limit";

export type BusinessContext = {
  business: {
    id: string;
    name: string;
    district: string | null;
    verified_at: string | null;
  };
  subscription: {
    id: string;
    status: "active" | "trialing" | "past_due" | "canceled";
    plan: {
      id: string;
      name: string;
      price_pen: number;
      monthly_propuestas: number | null;
    };
    propuestas_used_this_period: number;
    propuestas_remaining: number | null;
    current_period_end: string | null;
  } | null;
};

// Returns the logged-in business owner's business + active subscription.
// Used by BusinessLayout to render plan / quota widget.
export const getBusinessContext = createServerFn({ method: "GET" }).handler(
  async (): Promise<BusinessContext | null> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, district, verified_at")
      .eq("owner_id", user.id)
      .maybeSingle<{ id: string; name: string; district: string | null }>();

    if (!business) return null;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select(
        "id, status, plan_id, propuestas_used_this_period, current_period_end, plans(id, name, price_pen, monthly_propuestas)",
      )
      .eq("business_id", business.id)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

    let subOut: BusinessContext["subscription"] = null;
    if (sub) {
      type PlanJoinRow = {
        id: string;
        name: string;
        price_pen: number;
        monthly_propuestas: number | null;
      };
      type SubRow = {
        id: string;
        status: "active" | "trialing" | "past_due" | "canceled";
        plan_id: string;
        propuestas_used_this_period: number | null;
        current_period_end: string | null;
        plans: PlanJoinRow | null;
      };
      const s = sub as unknown as SubRow;
      const planRow = s.plans;
      const limit = planRow?.monthly_propuestas ?? null;
      const used = s.propuestas_used_this_period ?? 0;
      subOut = {
        id: s.id,
        status: s.status,
        plan: {
          id: planRow?.id ?? s.plan_id,
          name: planRow?.name ?? "",
          price_pen: planRow?.price_pen ?? 0,
          monthly_propuestas: limit,
        },
        propuestas_used_this_period: used,
        propuestas_remaining: limit === null ? null : Math.max(0, limit - used),
        current_period_end: s.current_period_end,
      };
    }

    return { business, subscription: subOut };
  },
);

export type BusinessProfile = {
  id: string;
  name: string;
  trade_name: string | null;
  ruc: string | null;
  phone: string | null;
  district: string | null;
  address: string | null;
  city: string | null;
  email: string | null;
  verification_status: "pending" | "verified" | "rejected";
};

export const getBusinessProfile = createServerFn({ method: "GET" }).handler(
  async (): Promise<BusinessProfile | null> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, trade_name, ruc, phone, district, address, city, email, verification_status",
      )
      .eq("owner_id", user.id)
      .maybeSingle<BusinessProfile>();

    if (error) throw sanitizeError(error, "No se pudo cargar tu cuenta.");
    return data ?? null;
  },
);

const updateBusinessSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(20).optional().nullable(),
  district: z.string().max(80).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  ruc: z
    .string()
    .regex(/^\d{11}$/u, "El RUC debe tener 11 dígitos.")
    .optional()
    .nullable(),
});

export const updateBusiness = createServerFn({ method: "POST" })
  .inputValidator(updateBusinessSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const rl = await rateLimitByUser("business:update", user.id, 20, 3600);
    if (!rl.allowed) throw new Error("Demasiados cambios. Intenta en una hora.");

    const updates: Record<string, string | null> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.district !== undefined) updates.district = data.district;
    if (data.address !== undefined) updates.address = data.address;
    if (data.ruc !== undefined) updates.ruc = data.ruc;

    if (Object.keys(updates).length === 0) return { ok: true };

    const { error } = await supabase.from("businesses").update(updates).eq("owner_id", user.id);
    if (error) throw sanitizeError(error, "No se pudo actualizar tu cuenta.");

    log.info("business_updated", { user_id: user.id, fields: Object.keys(updates) });
    return { ok: true };
  });
