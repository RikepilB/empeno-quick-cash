import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyClientOperations, type OperationStatus } from "@/services/operations";
import { buildTitle, categoryMeta, formatPEN } from "@/lib/categories";

export const Route = createFileRoute("/app/history")({ component: History });

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "completed", label: "Completados" },
  { key: "expired", label: "Vencidos" },
] as const;

function statusBadge(s: OperationStatus): { label: string; badge: string } {
  if (s === "completed") return { label: "Completado", badge: "badge-inactive" };
  if (s === "disputed") return { label: "En disputa", badge: "badge-reported" };
  if (s === "expired") return { label: "Vencido", badge: "badge-reported" };
  return { label: "Activo", badge: "badge-accepted" };
}

function History() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const ops = useQuery({
    queryKey: ["myClientOperations"],
    queryFn: () => listMyClientOperations(),
  });

  const counts = useMemo(() => {
    const data = ops.data ?? [];
    return {
      all: data.length,
      active: data.filter((o) => o.status === "pending_pickup").length,
      completed: data.filter((o) => o.status === "completed").length,
      expired: data.filter((o) => o.status === "expired" || o.status === "disputed").length,
    };
  }, [ops.data]);

  const filtered = useMemo(() => {
    const data = ops.data ?? [];
    if (filter === "all") return data;
    if (filter === "active") return data.filter((o) => o.status === "pending_pickup");
    if (filter === "completed") return data.filter((o) => o.status === "completed");
    if (filter === "expired")
      return data.filter((o) => o.status === "expired" || o.status === "disputed");
    return data;
  }, [ops.data, filter]);

  return (
    <ClientLayout title="Historial" subtitle="Todas tus operaciones">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs text-muted-foreground">Activos</div>
          <div className="mt-2 font-display text-3xl font-extrabold">{counts.active}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs text-muted-foreground">Completados</div>
          <div className="mt-2 font-display text-3xl font-extrabold">{counts.completed}</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="text-xs text-muted-foreground">Vencidos</div>
          <div className="mt-2 font-display text-3xl font-extrabold">{counts.expired}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium ${filter === f.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}
          >
            {f.label} ({counts[f.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Table */}
      {ops.isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando historial...
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="font-display text-lg font-bold uppercase">
            No tienes operaciones {filter === "all" ? "aún" : "en este estado"}.
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando aceptes una propuesta, tu operación aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase text-muted-foreground">
                <th className="px-5 py-3">Artículo</th>
                <th className="px-5 py-3">Casa de empeño</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Plazo</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const { label, badge } = statusBadge(it.status);
                const due = new Date(
                  new Date(it.accepted_at).getTime() + it.propuesta.plazo_dias * 24 * 3600 * 1000,
                ).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
                return (
                  <tr
                    key={it.id}
                    className="border-b border-border last:border-0 hover:bg-surface-2"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xl">
                          {categoryMeta(it.solicitud.category).emoji}
                        </div>
                        <span className="font-semibold">{buildTitle(it.solicitud)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {it.propuesta.business.name}
                    </td>
                    <td className="px-5 py-4 font-display font-bold">
                      {formatPEN(it.propuesta.monto_pen)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{due}</td>
                    <td className="px-5 py-4">
                      <span className={`badge-dot ${badge}`}>{label}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/app/code"
                        search={{ propuesta_id: it.propuesta.id }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Ver código →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ClientLayout>
  );
}
