import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/db/server";
import { chargeOnce, isCulqiLive } from "@/lib/payments/client";

// ============================================================================
// Types
// ============================================================================
export type Plan = {
  id: string;
  name: string;
  price_pen: number;
  monthly_propuestas: number | null;
  features: string[];
};

export type Invoice = {
  id: string;
  plan_id: string | null;
  amount_pen: number;
  status: "pending" | "paid" | "failed" | "refunded" | "demo";
  culqi_charge_id: string | null;
  paid_at: string | null;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
};

// ============================================================================
// listPlans — public catalog
// ============================================================================
export const listPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<Plan[]> => {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("plans")
      .select("id, name, price_pen, monthly_propuestas, features")
      .order("price_pen", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price_pen: p.price_pen,
      monthly_propuestas: p.monthly_propuestas,
      features: Array.isArray(p.features) ? p.features : [],
    }));
  },
);

// ============================================================================
// listMyInvoices — current biz invoice history
// ============================================================================
export const listMyInvoices = createServerFn({ method: "GET" }).handler(
  async (): Promise<Invoice[]> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle<{ id: string }>();
    if (!biz) return [];

    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, plan_id, amount_pen, status, culqi_charge_id, paid_at, created_at, period_start, period_end",
      )
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Invoice[];
  },
);

// ============================================================================
// startCheckout — initiate plan upgrade
//   - If CULQI_SECRET_KEY is set and the client passed `token_id`, do a real
//     Culqi charge then flip the plan.
//   - Otherwise run the DEMO path: record a `status='demo'` invoice and flip
//     the plan immediately. Used while live keys are pending.
// ============================================================================
const startCheckoutSchema = z.object({
  plan_id: z.string().min(1),
  token_id: z.string().min(1).optional(),
});

export const startCheckout = createServerFn({ method: "POST" })
  .inputValidator(startCheckoutSchema)
  .handler(
    async ({
      data,
    }): Promise<{
      ok: true;
      mode: "live" | "demo";
      subscription_id: string;
      invoice_id: string;
      plan_id: string;
    }> => {
      const supabase = getSupabaseServer();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Resolve the plan + verify it exists
      const { data: plan, error: planErr } = await supabase
        .from("plans")
        .select("id, name, price_pen")
        .eq("id", data.plan_id)
        .single<{ id: string; name: string; price_pen: number }>();
      if (planErr || !plan) throw new Error("Plan no encontrado.");

      const live = isCulqiLive();
      if (live && !data.token_id) {
        throw new Error("token_id requerido (Culqi en modo live).");
      }
      const mode: "live" | "demo" = live ? "live" : "demo";
      let charge: { id: string; status: "paid" | "failed" | "demo" } = {
        id: `demo_charge_${Date.now()}`,
        status: "demo",
      };

      if (live && data.token_id) {
        charge = await chargeOnce({
          token_id: data.token_id,
          amount_pen: plan.price_pen,
          email: user.email ?? "no-email@empenalo.local",
          metadata: { plan_id: plan.id, user_id: user.id },
        });
        if (charge.status === "failed") {
          throw new Error("El pago fue rechazado por Culqi. Intenta con otra tarjeta.");
        }
      }

      // Flip the subscription via security-definer RPC
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: subRow, error: subErr } = await supabase.rpc("change_subscription_plan", {
        p_plan_id: plan.id,
        p_culqi_subscription_id: null,
        p_period_end: periodEnd,
      });
      if (subErr) throw new Error(subErr.message);
      const sub = subRow as { id: string };

      // Record the invoice
      const { data: invRow, error: invErr } = await supabase.rpc("record_invoice", {
        p_subscription_id: sub.id,
        p_plan_id: plan.id,
        p_amount_pen: plan.price_pen,
        p_status: charge.status,
        p_culqi_charge_id: charge.id,
        p_culqi_order_id: null,
        p_period_start: new Date().toISOString(),
        p_period_end: periodEnd,
      });
      if (invErr) throw new Error(invErr.message);
      const inv = invRow as { id: string };

      return {
        ok: true,
        mode,
        subscription_id: sub.id,
        invoice_id: inv.id,
        plan_id: plan.id,
      };
    },
  );

// ============================================================================
// getBillingMode — let the UI know if live charges are wired up
// ============================================================================
export const getBillingMode = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ mode: "live" | "demo" }> => {
    return { mode: isCulqiLive() ? "live" : "demo" };
  },
);
