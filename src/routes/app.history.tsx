import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
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

  const filtered = useMemo(() => {
    const list = ops.data ?? [];
    if (filter === "all") return list;
    if (filter === "active") return list.filter((o) => o.status === "pending_pickup");
    if (filter === "completed") return list.filter((o) => o.status === "completed");
    if (filter === "expired")
      return list.filter((o) => o.status === "expired" || o.status === "disputed");
    return list;
  }, [ops.data, filter]);

  return (
    <PhoneFrame title="Historial" back="/app/dashboard">
      <div className="p-6">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${filter === f.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {ops.isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando historial...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-xs text-muted-foreground">
              No tienes operaciones {filter === "all" ? "aún" : "en este estado"}.
            </div>
          ) : (
            filtered.map((it) => {
              const { label, badge } = statusBadge(it.status);
              const due = new Date(
                new Date(it.accepted_at).getTime() + it.propuesta.plazo_dias * 24 * 3600 * 1000,
              ).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
              return (
                <Link
                  key={it.id}
                  to="/app/code"
                  search={{ propuesta_id: it.propuesta.id }}
                  className="block rounded-2xl border border-border bg-surface p-4 hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl">
                      {categoryMeta(it.solicitud.category).emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {buildTitle(it.solicitud)}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {it.propuesta.business.name}
                          </div>
                        </div>
                        <span className={`badge-dot ${badge} shrink-0`}>{label}</span>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="text-[10px] uppercase text-muted-foreground">Monto</div>
                          <div className="font-display text-lg font-bold">
                            {formatPEN(it.propuesta.monto_pen)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase text-muted-foreground">Vence</div>
                          <div className="text-xs">{due}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
