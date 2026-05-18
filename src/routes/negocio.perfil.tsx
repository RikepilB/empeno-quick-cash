import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { Check, Loader2, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBusinessContext } from "@/server-fns/business";
import { listPlans, listMyInvoices, startCheckout, getBillingMode } from "@/server-fns/billing";
import { formatPEN } from "@/lib/categories";
import { openCheckout, getCulqiPublicKey } from "@/lib/culqi-checkout";

export const Route = createFileRoute("/negocio/perfil")({ component: Perfil });

function Perfil() {
  const qc = useQueryClient();
  const context = useQuery({ queryKey: ["businessContext"], queryFn: () => getBusinessContext() });
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => listPlans() });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => listMyInvoices() });
  const billingMode = useQuery({ queryKey: ["billingMode"], queryFn: () => getBillingMode() });

  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const checkout = useMutation({
    mutationFn: (args: { plan_id: string; token_id?: string }) =>
      startCheckout({ data: args }),
    onSuccess: async (res) => {
      setMsg(
        res.mode === "demo"
          ? `Plan ${res.plan_id} activado en modo demo. Cuando agregues CULQI_SECRET_KEY se cobrará por Culqi.`
          : `Plan ${res.plan_id} activado correctamente.`,
      );
      await qc.invalidateQueries({ queryKey: ["businessContext"] });
      await qc.invalidateQueries({ queryKey: ["invoices"] });
      setPendingPlan(null);
    },
    onError: (err) => {
      setMsg(err instanceof Error ? err.message : "Error al cambiar de plan");
      setPendingPlan(null);
    },
  });

  const sub = context.data?.subscription;
  const business = context.data?.business;
  const currentPlanId = sub?.plan.id ?? null;
  const isDemo = billingMode.data?.mode === "demo";
  const missingPublicKey = !isDemo && !getCulqiPublicKey();

  async function handlePlanClick(plan: { id: string; price_pen: number }) {
    setMsg(null);
    setPendingPlan(plan.id);
    try {
      if (isDemo) {
        checkout.mutate({ plan_id: plan.id });
        return;
      }
      const tok = await openCheckout({
        amount_pen: plan.price_pen,
        plan_id: plan.id,
      });
      if (!tok) {
        setPendingPlan(null);
        return;
      }
      checkout.mutate({ plan_id: plan.id, token_id: tok.token_id });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error al abrir Culqi");
      setPendingPlan(null);
    }
  }

  return (
    <BusinessLayout title="Negocio" subtitle="Datos del negocio, plan y facturación">
      {msg && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">{msg}</div>
          <button onClick={() => setMsg(null)} className="text-xs text-muted-foreground hover:text-foreground">
            cerrar
          </button>
        </div>
      )}

      {isDemo && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-status-pending/30 bg-status-pending/10 p-4 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-status-pending" />
          <div>
            <div className="font-semibold text-status-pending">Modo demo de facturación</div>
            <div className="text-muted-foreground">
              Aún no se ha configurado <code>CULQI_SECRET_KEY</code>. Los cambios de plan se aplican al instante sin
              cobrar. Cuando agregues la clave, las suscripciones pasarán por Culqi automáticamente.
            </div>
          </div>
        </div>
      )}

      {missingPublicKey && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-destructive" />
          <div>
            <div className="font-semibold text-destructive">Falta clave pública de Culqi</div>
            <div className="text-muted-foreground">
              El servidor está en modo live pero <code>VITE_CULQI_PUBLIC_KEY</code> no está
              configurada en el cliente. No se puede cobrar hasta que se agregue.
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Current plan */}
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 lg:col-span-1">
          <div className="text-xs uppercase text-muted-foreground">Plan activo</div>
          {context.isLoading ? (
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : !sub ? (
            <div className="mt-2 text-sm text-muted-foreground">Sin suscripción activa.</div>
          ) : (
            <>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-display text-3xl font-extrabold">{sub.plan.name}</span>
                <span className="badge-dot badge-accepted">{sub.status}</span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <span className="font-display text-2xl font-bold">
                  {sub.plan.monthly_propuestas === null
                    ? `${sub.propuestas_used_this_period}`
                    : `${sub.propuestas_used_this_period}/${sub.plan.monthly_propuestas}`}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {sub.plan.monthly_propuestas === null ? "ilimitadas" : "propuestas usadas"}
                </span>
              </div>
              {sub.plan.monthly_propuestas !== null && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(
                        100,
                        (sub.propuestas_used_this_period / Math.max(1, sub.plan.monthly_propuestas)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              )}
              {sub.current_period_end && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Próxima renovación:{" "}
                  <span className="font-semibold text-foreground">
                    {new Date(sub.current_period_end).toLocaleDateString("es-PE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Plan picker */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase">Cambiar plan</h3>
            <Link to="/negocio/plan" className="text-xs text-muted-foreground hover:text-foreground">
              Ver comparativa →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {plans.isLoading ? (
              <div className="col-span-3 flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando planes...
              </div>
            ) : (
              (plans.data ?? []).map((p) => {
                const isCurrent = currentPlanId === p.id;
                const submitting = pendingPlan === p.id && checkout.isPending;
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col rounded-xl border p-5 ${
                      isCurrent ? "border-primary bg-primary/5" : "border-border bg-background"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] uppercase text-primary-foreground">
                        Tu plan
                      </span>
                    )}
                    <div className="font-display text-lg font-bold uppercase">{p.name}</div>
                    <div className="mt-2 flex items-end gap-1">
                      <span className="font-display text-3xl font-extrabold">{formatPEN(p.price_pen)}</span>
                      <span className="pb-1 text-xs text-muted-foreground">/mes</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.monthly_propuestas === null
                        ? "Propuestas ilimitadas"
                        : `${p.monthly_propuestas} propuestas/mes`}
                    </div>
                    <ul className="mt-4 flex-1 space-y-1.5 text-xs">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5">
                          <Check className="mt-0.5 h-3 w-3 text-primary" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={isCurrent || submitting || missingPublicKey}
                      onClick={() => {
                        handlePlanClick({ id: p.id, price_pen: p.price_pen });
                      }}
                      className={`mt-5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-60 ${
                        isCurrent
                          ? "border border-border bg-surface text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {submitting ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Procesando...
                        </span>
                      ) : isCurrent ? (
                        "Plan actual"
                      ) : isDemo ? (
                        "Cambiar (demo)"
                      ) : (
                        "Pagar y cambiar"
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase">Historial de facturas</h3>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ReceiptText className="h-3.5 w-3.5" />
              {(invoices.data ?? []).length} facturas
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            {invoices.isLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : (invoices.data ?? []).length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aún no tienes facturas. Cambia de plan para generar la primera.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-background text-left text-[11px] uppercase text-muted-foreground">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Monto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Periodo</th>
                    <th className="px-4 py-3">Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoices.data ?? []).map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold uppercase">{inv.plan_id ?? "—"}</td>
                      <td className="px-4 py-3 font-display font-bold">{formatPEN(inv.amount_pen)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge-dot ${invStatusBadge(inv.status)}`}>{invStatusLabel(inv.status)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {inv.period_start && inv.period_end
                          ? `${new Date(inv.period_start).toLocaleDateString("es-PE", { day: "numeric", month: "short" })} – ${new Date(inv.period_end).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
                        {inv.culqi_charge_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Business identity (kept as static for now — out of Phase 4 scope) */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-3">
          <h3 className="font-display text-xl font-bold uppercase">Datos del negocio</h3>
          <div className="mt-3 text-sm text-muted-foreground">
            {business?.name ?? "—"} · {business?.district ?? "Sin distrito"}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Próximamente: edición de datos comerciales y equipo.
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}

function invStatusBadge(s: string): string {
  if (s === "paid") return "badge-accepted";
  if (s === "demo") return "badge-new";
  if (s === "failed" || s === "refunded") return "badge-reported";
  return "badge-pending";
}

function invStatusLabel(s: string): string {
  if (s === "paid") return "Pagada";
  if (s === "demo") return "Demo";
  if (s === "failed") return "Fallida";
  if (s === "refunded") return "Reembolsada";
  if (s === "pending") return "Pendiente";
  return s;
}
