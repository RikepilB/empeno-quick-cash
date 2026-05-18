import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/ui/BusinessLayout";
import { Filter, MapPin, Clock, Users, ArrowRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listActiveSolicitudes } from "@/services/solicitudes";
import { CATEGORIES, categoryMeta, buildTitle, relativeTime, formatPEN } from "@/lib/categories";

export const Route = createFileRoute("/negocio/solicitudes")({ component: Solicitudes });

const SORTS = [
  { key: "recent", label: "Más recientes" },
  { key: "amount_desc", label: "Mayor monto esperado" },
  { key: "fewest_proposals", label: "Menos propuestas recibidas" },
] as const;

function Solicitudes() {
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("recent");

  const list = useQuery({
    queryKey: ["activeSolicitudes", category],
    queryFn: () =>
      listActiveSolicitudes({
        data: category === "all" ? {} : { category },
      }),
  });

  const items = useMemo(() => {
    const arr = list.data ?? [];
    if (sort === "amount_desc") return [...arr].sort((a, b) => (b.expected_amount_pen ?? 0) - (a.expected_amount_pen ?? 0));
    if (sort === "fewest_proposals") return [...arr].sort((a, b) => a.propuestas_count - b.propuestas_count);
    return arr;
  }, [list.data, sort]);

  return (
    <BusinessLayout title="Solicitudes" subtitle={`${items.length} solicitudes activas en este momento`}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs">
          <Filter className="h-3.5 w-3.5" /> Filtros
        </button>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs"
        >
          <option value="all">Categoría: Todas</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {list.isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando solicitudes...
        </div>
      ) : list.error ? (
        <div className="rounded-2xl border border-status-reported/30 bg-status-reported/10 p-6 text-sm text-status-reported">
          No pudimos cargar las solicitudes. ¿Tienes una suscripción activa?
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          No hay solicitudes activas en este momento. Vuelve más tarde.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s) => {
            const isNew = Date.now() - new Date(s.created_at).getTime() < 30 * 60_000;
            return (
              <Link
                key={s.id}
                to="/negocio/solicitud"
                search={{ id: s.id }}
                className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl">
                    {categoryMeta(s.category).emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isNew && <span className="badge-dot badge-new">Nueva</span>}
                      <span className="text-[11px] uppercase text-muted-foreground">
                        {categoryMeta(s.category).label}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 font-display text-base font-bold leading-tight">
                      {buildTitle(s)}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      Estado: {s.condition ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Monto referencia</div>
                    {s.expected_amount_pen ? (
                      <div className="font-display text-xl font-bold">{formatPEN(s.expected_amount_pen)}</div>
                    ) : (
                      <span className="badge-dot badge-inactive">Sin precio ref.</span>
                    )}
                  </div>
                  <div className="space-y-1 text-right text-[11px] text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" /> {s.expected_term_days ?? "—"} días · {relativeTime(s.created_at)}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <MapPin className="h-3 w-3" /> {s.district ?? "—"}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-3 w-3" /> {s.propuestas_count} {s.propuestas_count === 1 ? "propuesta" : "propuestas"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  Ver detalle y enviar propuesta <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </BusinessLayout>
  );
}
