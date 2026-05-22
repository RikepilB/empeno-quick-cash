import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
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
    queryFn: () => (id ? getSolicitud({ data: { id } }) : Promise.resolve(null)),
    enabled: !!id,
  });

  const propuestas = useQuery({
    queryKey: ["propuestas", id],
    queryFn: () =>
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
      <PhoneFrame title="Propuestas" back="/app/dashboard">
        <div className="p-6 text-sm text-muted-foreground md:p-8">
          Selecciona una publicación en tu panel para ver sus propuestas.
          <div className="mt-4 md:max-w-xs">
            <Link to="/app/dashboard" className="btn-primary w-full">
              Volver al panel
            </Link>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame title={`Propuestas (${sorted.length})`} back="/app/dashboard">
      <div className="p-6 md:p-8">
        <div className="rounded-xl border border-border bg-surface p-3 md:p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl md:h-14 md:w-14 md:text-3xl">
              {solicitud.data ? categoryMeta(solicitud.data.category).emoji : "—"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold md:text-base">
                {solicitud.data ? buildTitle(solicitud.data) : "Cargando..."}
              </div>
              <div className="text-[11px] text-muted-foreground md:text-xs">
                {sorted.length} {sorted.length === 1 ? "oferta activa" : "ofertas activas"}
                {closedCount > 0 ? ` · ${closedCount} cerradas` : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide md:text-base">
            Compara y elige
          </h3>
          <div role="radiogroup" aria-label="Ordenar propuestas" className="flex flex-wrap gap-2">
            {SORTS.map((s) => {
              const active = sort === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSort(s.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {propuestas.isLoading ? (
            <div className="col-span-full flex items-center justify-center py-8 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando propuestas...
            </div>
          ) : sorted.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
              <div className="font-display text-base font-bold uppercase">
                Aún no hay propuestas
              </div>
              <p className="mt-2 text-xs text-muted-foreground md:text-sm">
                Tu publicación es visible para casas de empeño afiliadas. Te avisaremos cuando
                lleguen ofertas.
              </p>
            </div>
          ) : (
            sorted.map((p) => {
              const isBest = p.id === bestId;
              return (
                <Link
                  key={p.id}
                  to="/app/proposal-detail"
                  search={{ propuesta_id: p.id }}
                  className={`block rounded-2xl border p-4 transition md:p-5 ${
                    isBest
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-display text-base font-bold uppercase md:text-lg">
                        {p.business.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.business.district ?? "—"}
                      </div>
                    </div>
                    {isBest && (
                      <span className="badge-dot badge-accepted shrink-0">Mejor oferta</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Te ofrecen</div>
                      <div className="font-display text-3xl font-extrabold text-primary md:text-4xl">
                        {formatPEN(p.monto_pen)}
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
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

                  <div className="mt-4 flex gap-2">
                    <span className="flex-1 rounded-lg border border-border bg-background py-2 text-center text-xs">
                      Ver detalle
                    </span>
                    <span
                      className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${
                        isBest
                          ? "bg-primary text-primary-foreground"
                          : "border border-primary/40 text-primary"
                      }`}
                    >
                      Aceptar
                    </span>
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
