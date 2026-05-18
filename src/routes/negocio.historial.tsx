import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMyBusinessOperations, type OperationStatus } from "@/server-fns/operations";
import { buildTitle, categoryMeta, formatPEN } from "@/lib/categories";

export const Route = createFileRoute("/negocio/historial")({ component: Historial });

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "completed", label: "Concretadas" },
  { key: "disputed", label: "En disputa" },
  { key: "expired", label: "Vencidas" },
] as const;

function statusBadge(s: OperationStatus): { label: string; badge: string } {
  if (s === "completed") return { label: "Concretada", badge: "badge-inactive" };
  if (s === "disputed") return { label: "En disputa", badge: "badge-reported" };
  if (s === "expired") return { label: "Vencida", badge: "badge-inactive" };
  return { label: "Activa", badge: "badge-accepted" };
}

function Historial() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const list = useQuery({
    queryKey: ["myBusinessOperations"],
    queryFn: () => listMyBusinessOperations(),
  });

  const counts = useMemo(() => {
    const data = list.data ?? [];
    return {
      all: data.length,
      active: data.filter((o) => o.status === "pending_pickup").length,
      completed: data.filter((o) => o.status === "completed").length,
      disputed: data.filter((o) => o.status === "disputed").length,
      expired: data.filter((o) => o.status === "expired").length,
    };
  }, [list.data]);

  const filtered = useMemo(() => {
    const data = list.data ?? [];
    if (filter === "all") return data;
    if (filter === "active") return data.filter((o) => o.status === "pending_pickup");
    if (filter === "completed") return data.filter((o) => o.status === "completed");
    if (filter === "disputed") return data.filter((o) => o.status === "disputed");
    return data.filter((o) => o.status === "expired");
  }, [list.data, filter]);

  return (
    <BusinessLayout title="Historial de operaciones" subtitle="Todas las operaciones del negocio">
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Stat label="Activas (en garantía)" value={counts.active.toString()} tone="primary" />
        <Stat label="Concretadas" value={counts.completed.toString()} />
        <Stat label="En disputa" value={counts.disputed.toString()} />
        <Stat label="Vencidas" value={counts.expired.toString()} />
      </div>

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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando historial...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          Aún no hay operaciones {filter === "all" ? "registradas" : "en este estado"}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase text-muted-foreground">
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Artículo</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Tasa / Plazo</th>
                <th className="px-5 py-3">Vence</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const { label, badge } = statusBadge(o.status);
                const due = new Date(
                  new Date(o.accepted_at).getTime() + o.propuesta.plazo_dias * 24 * 3600 * 1000,
                ).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
                return (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(o.accepted_at).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-lg">
                          {categoryMeta(o.solicitud.category).emoji}
                        </div>
                        <span className="font-semibold">{buildTitle(o.solicitud)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-display font-bold">{formatPEN(o.propuesta.monto_pen)}</td>
                    <td className="px-5 py-4">{o.propuesta.tasa_mensual}% · {o.propuesta.plazo_dias}d</td>
                    <td className="px-5 py-4 text-muted-foreground">{due}</td>
                    <td className="px-5 py-4"><span className={`badge-dot ${badge}`}>{label}</span></td>
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

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-surface"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold">{value}</div>
    </div>
  );
}
