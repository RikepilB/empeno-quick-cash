import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { MapPin, Loader2 } from "lucide-react";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSolicitud } from "@/services/solicitudes";
import { listPropuestasForSolicitud, type PropuestaForClient } from "@/services/propuestas";
import { categoryMeta, buildTitle, formatPEN } from "@/lib/categories";

const searchSchema = z.object({ id: z.string().uuid().optional() });

export const Route = createFileRoute("/app/proposals")({
  component: Proposals,
  validateSearch: searchSchema,
});

type SortKey = "monto_desc" | "tasa_asc" | "plazo_desc";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "monto_desc", label: "Mayor monto" },
  { key: "tasa_asc", label: "Menor tasa" },
  { key: "plazo_desc", label: "Mayor plazo" },
];

function Proposals() {
  const { id } = useSearch({ from: "/app/proposals" });
  const [sort, setSort] = useState<SortKey>("monto_desc");

  const solicitud = useQuery({
    queryKey: ["solicitud", id],
    fn: () => (id ? getSolicitud({ data: { id } }) : Promise.resolve(null)),
    enabled: !!id,
  });

  const propuestas = useQuery({
    queryKey: ["propuestas", id],
    fn: () =>
      id
        ? listPropuestasForSolicitud({ data: { solicitud_id: id } })
        : Promise.resolve([] as PropuestaForClient[]),
    enabled: !!id,
  });

  const sorted = useMemo(() => {
    const list = propuestas.data ?? [];
    const pending = list.filter((p) => p.status === "pending");
    if (sort === "monto_desc") return [...pending].sort((a, b) => b.monto_pen - a.monto_pen);
    if (sort === "tasa_asc") return [...pending].sort((a, b) => a.tasa_mensual - b.tasa_mensual);
    return [...pending].sort((a, b) => b.plazo_dias - a.plazo_dias);
  }, [propuestas.data, sort]);

  const bestId = sorted[0]?.id;
  const closedCount = (propuestas.data?.length ?? 0) - sorted.length;

  if (!id) {
    return (
      <ClientLayout title="Propuestas" subtitle="Propuestas recibidas">
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <div className="font-display text-xl font-bold uppercase">
              Selecciona una publicación
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Ve a tu panel para elegir cuál publicación quieres ver.
            </p>
            <Link to="/app/dashboard" className="btn-primary mt-5 inline-flex">
              Volver al panel
            </Link>
          </div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Propuestas" subtitle={`${sorted.length} ofertas activas`}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3 space-y-6">
          {/* Solicitud summary */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2 text-3xl">
                {solicitud.data ? categoryMeta(solicitud.data.category).emoji : "—"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold">
                  {solicitud.data ? buildTitle(solicitud.data) : "Cargando..."}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {sorted.length} {sorted.length === 1 ? "oferta activa" : "ofertas activas"}
                  {closedCount > 0 ? ` · ${closedCount} cerradas` : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Sort controls */}
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-base font-bold uppercase">Compara y elige</h3>
            <div
              role="radiogroup"
              aria-label="Ordenar propuestas"
              className="flex flex-wrap gap-2 ml-auto"
            >
              {SORTS.map((s) => {
                const active = sort === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSort(s.key)}
                    className={`rounded-full border px-4 py-1.5 text-sm ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground hover:border-primary/40"}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Proposals grid */}
          {propuestas.isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando propuestas...
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <div className="font-display text-xl font-bold uppercase">Aún no hay propuestas</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu publicación es visible para casas de empeño afiliadas. Te avisaremos cuando
                lleguen ofertas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sorted.map((p) => {
                const isBest = p.id === bestId;
                return (
                  <Link
                    key={p.id}
                    to="/app/proposal-detail"
                    search={{ propuesta_id: p.id }}
                    className={`block rounded-2xl border p-5 transition ${isBest ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" : "border-border bg-surface hover:border-primary/40"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-display text-lg font-bold uppercase">
                          {p.business.name}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {p.business.district ?? "—"}
                        </div>
                      </div>
                      {isBest && (
                        <span className="badge-dot badge-accepted shrink-0">Mejor oferta</span>
                      )}
                    </div>

                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-xs uppercase text-muted-foreground">Te ofrecen</div>
                        <div className="font-display text-4xl font-extrabold text-primary">
                          {formatPEN(p.monto_pen)}
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>
                          Tasa{" "}
                          <span className="font-display text-base text-foreground">
                            {p.tasa_mensual}%
                          </span>
                          /mes
                        </div>
                        <div>
                          Plazo{" "}
                          <span className="font-display text-base text-foreground">
                            {p.plazo_dias}
                          </span>{" "}
                          días
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <span className="flex-1 rounded-lg border border-border bg-background py-2.5 text-center text-sm">
                        Ver detalle
                      </span>
                      <span
                        className={`flex-1 rounded-lg py-2.5 text-center text-sm font-semibold ${isBest ? "bg-primary text-primary-foreground" : "border border-primary/40 text-primary"}`}
                      >
                        Aceptar
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
