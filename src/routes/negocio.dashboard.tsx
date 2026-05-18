import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/ui/BusinessLayout";
import { TrendingUp, Send, CheckCircle2, Inbox, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listActiveSolicitudes } from "@/services/solicitudes";
import { listMyPropuestas } from "@/services/propuestas";
import { getBusinessContext } from "@/services/business";
import { categoryMeta, buildTitle, formatPEN, relativeTime } from "@/lib/categories";

export const Route = createFileRoute("/negocio/dashboard")({ component: BizDashboard });

function BizDashboard() {
  const context = useQuery({ queryKey: ["businessContext"], queryFn: () => getBusinessContext() });
  const available = useQuery({
    queryKey: ["activeSolicitudes", "all"],
    queryFn: () => listActiveSolicitudes({ data: {} }),
  });
  const myPropuestas = useQuery({ queryKey: ["myPropuestas"], queryFn: () => listMyPropuestas() });

  const sub = context.data?.subscription;
  const business = context.data?.business;
  const sent = myPropuestas.data?.length ?? 0;
  const accepted = myPropuestas.data?.filter((p) => p.status === "accepted").length ?? 0;
  const pending = myPropuestas.data?.filter((p) => p.status === "pending") ?? [];
  const totalAvail = available.data?.length ?? 0;
  const conversionRate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;

  const newest = useMemo(() => (available.data ?? []).slice(0, 5), [available.data]);

  const limit = sub?.plan.monthly_propuestas;
  const remaining = sub?.propuestas_remaining;

  const today = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <BusinessLayout
      title={`Buen día${business?.name ? `, ${business.name}` : ""}`}
      subtitle={`Aquí está tu actividad de hoy · ${today}`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          icon={Inbox}
          label="Solicitudes disponibles"
          value={totalAvail.toString()}
          delta={available.isLoading ? "Cargando..." : `${newest.length} recientes`}
          tone="primary"
        />
        <Metric
          icon={Send}
          label="Propuestas enviadas"
          value={limit !== null && limit !== undefined ? `${sub?.propuestas_used_this_period ?? 0}/${limit}` : (sub?.propuestas_used_this_period ?? 0).toString()}
          delta={remaining !== null && remaining !== undefined ? `${remaining} restantes` : "Ilimitadas"}
        />
        <Metric icon={CheckCircle2} label="Aceptadas" value={accepted.toString()} delta="todas tus propuestas" />
        <Metric icon={TrendingUp} label="Tasa conversión" value={`${conversionRate}%`} delta="aceptadas / enviadas" />
      </div>

      {limit !== null && limit !== undefined && remaining !== null && remaining !== undefined && remaining <= 5 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-status-pending/30 bg-status-pending/10 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-status-pending" />
          <div>
            <span className="font-semibold text-status-pending">Te quedan {remaining} propuestas</span>
            <span className="text-muted-foreground"> este mes. Considera el plan Avanzado para ofertas ilimitadas.</span>
          </div>
          <Link to="/negocio/perfil" className="ml-auto text-xs font-semibold text-primary hover:underline">
            Mejorar plan →
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase">Solicitudes nuevas</h2>
            <Link to="/negocio/solicitudes" className="text-xs font-semibold text-primary hover:underline">Ver todas →</Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {available.isLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : newest.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No hay solicitudes activas ahora mismo.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                    <th className="px-4 py-3">Artículo</th>
                    <th className="px-4 py-3">Monto ref.</th>
                    <th className="px-4 py-3">Plazo</th>
                    <th className="px-4 py-3">Distrito</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {newest.map((s) => {
                    const isNew = Date.now() - new Date(s.created_at).getTime() < 30 * 60_000;
                    return (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isNew && <span className="badge-dot badge-new">Nueva</span>}
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{categoryMeta(s.category).emoji}</span>
                              <div>
                                <div className="font-semibold">{buildTitle(s)}</div>
                                <div className="text-[11px] text-muted-foreground">{relativeTime(s.created_at)}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-display font-bold">{formatPEN(s.expected_amount_pen)}</td>
                        <td className="px-4 py-3">{s.expected_term_days ?? "—"} d</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.district ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/negocio/solicitud"
                            search={{ id: s.id }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Detalle <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside>
          <h2 className="mb-3 font-display text-xl font-bold uppercase">Propuestas en curso</h2>
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-3">
            {myPropuestas.isLoading ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : pending.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Sin propuestas pendientes.
              </div>
            ) : (
              pending.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to="/negocio/propuestas"
                  className="block rounded-lg border border-border bg-background p-3 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="badge-dot badge-pending">Pendiente</span>
                    <span className="text-[11px] text-muted-foreground">
                      {relativeTime(p.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{buildTitle({ ...p.solicitud_summary })}</div>
                  <div className="text-xs text-muted-foreground">{formatPEN(p.monto_pen)}</div>
                </Link>
              ))
            )}
            <Link to="/negocio/propuestas" className="block rounded-lg py-2 text-center text-xs text-primary hover:underline">
              Ver todas mis propuestas
            </Link>
          </div>
        </aside>
      </div>
    </BusinessLayout>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  delta: string;
  tone?: "primary";
}) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-surface"}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>
    </div>
  );
}
