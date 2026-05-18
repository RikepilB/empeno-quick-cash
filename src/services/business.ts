import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServer } from "@/lib/db/server";
import { sanitizeError } from "@/lib/logger";

export type BusinessContext = {
  business: {
    id: string;
    name: string;
    district: string | null;
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
      .select("id, name, district")
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
      const planRow = (sub as any).plans;
      const limit = planRow?.monthly_propuestas ?? null;
      const used = (sub as any).propuestas_used_this_period ?? 0;
      subOut = {
        id: (sub as any).id,
        status: (sub as any).status,
        plan: {
          id: planRow?.id ?? (sub as any).plan_id,
          name: planRow?.name ?? "",
          price_pen: planRow?.price_pen ?? 0,
          monthly_propuestas: limit,
        },
        propuestas_used_this_period: used,
        propuestas_remaining: limit === null ? null : Math.max(0, limit - used),
        current_period_end: (sub as any).current_period_end,
      };
    }

    return { business, subscription: subOut };
  },
);
