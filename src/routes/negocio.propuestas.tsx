import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { ArrowRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyPropuestas, type PropuestaForBusiness, type PropuestaStatus } from "@/server-fns/propuestas";
import { categoryMeta, buildTitle, formatPEN } from "@/lib/categories";

export const Route = createFileRoute("/negocio/propuestas")({ component: MisPropuestas });

const FILTERS: Array<{ key: "all" | PropuestaStatus; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "accepted", label: "Aceptadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "expired", label: "Expiradas" },
];

function statusBadge(s: PropuestaStatus): { label: string; badge: string } {
  if (s === "accepted") return { label: "Aceptada", badge: "badge-accepted" };
  if (s === "rejected") return { label: "Rechazada", badge: "badge-reported" };
  if (s === "expired") return { label: "Expirada", badge: "badge-inactive" };
  return { label: "Pendiente", badge: "badge-pending" };
}

function MisPropuestas() {
  const [filter, setFilter] = useState<"all" | PropuestaStatus>("all");
  const list = useQuery({ queryKey: ["myPropuestas"], queryFn: () => listMyPropuestas() });

  const counts = useMemo(() => {
    const data = list.data ?? [];
    const c: Record<string, number> = { all: data.length, pending: 0, accepted: 0, rejected: 0, expired: 0 };
    for (const p of data) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [list.data]);

  const filtered = useMemo<PropuestaForBusiness[]>(() => {
    const data = list.data ?? [];
    if (filter === "all") return data;
    return data.filter((p) => p.status === filter);
  }, [list.data, filter]);

  return (
    <BusinessLayout title="Mis propuestas" subtitle="Seguimiento de todas las propuestas enviadas">
      <div className="mb-4 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs ${filter === f.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}
          >
            {f.label} ({counts[f.key] ?? 0})
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando propuestas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          No tienes propuestas {filter === "all" ? "todavía" : "en este estado"}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase text-muted-foreground">
                <th className="px-5 py-3">Artículo</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Tasa</th>
                <th className="px-5 py-3">Plazo</th>
                <th className="px-5 py-3">Fecha envío</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const { label, badge } = statusBadge(p.status);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xl">
                          {categoryMeta(p.solicitud_summary.category).emoji}
                        </div>
                        <div>
                          <div className="font-semibold">{buildTitle({ ...p.solicitud_summary })}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {p.solicitud_summary.district ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-display font-bold">{formatPEN(p.monto_pen)}</td>
                    <td className="px-5 py-4">{p.tasa_mensual}%</td>
                    <td className="px-5 py-4">{p.plazo_dias}d</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-4"><span className={`badge-dot ${badge}`}>{label}</span></td>
                    <td className="px-5 py-4 text-right">
                      {p.status === "accepted" && p.operation ? (
                        <Link
                          to="/negocio/propuesta"
                          search={{ id: p.id }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          Ver código <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </BusinessLayout>
  );
}
