import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
import { ArrowUpDown, MapPin, Loader2 } from "lucide-react";
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

type SortKey = "monto_desc" | "tasa_asc" | "plazo_asc";

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
      id ? listPropuestasForSolicitud({ data: { solicitud_id: id } }) : Promise.resolve([] as PropuestaForClient[]),
    enabled: !!id,
  });

  const sorted = useMemo(() => {
    const list = propuestas.data ?? [];
    const pending = list.filter((p) => p.status === "pending");
    if (sort === "monto_desc") return [...pending].sort((a, b) => b.monto_pen - a.monto_pen);
    if (sort === "tasa_asc") return [...pending].sort((a, b) => a.tasa_mensual - b.tasa_mensual);
    return [...pending].sort((a, b) => a.plazo_dias - b.plazo_dias);
  }, [propuestas.data, sort]);

  const bestId = sorted[0]?.id;

  if (!id) {
    return (
      <PhoneFrame title="Propuestas" back="/app/dashboard">
        <div className="p-6 text-sm text-muted-foreground">
          Selecciona una publicación en tu panel para ver sus propuestas.
          <div className="mt-4">
            <Link to="/app/dashboard" className="btn-primary w-full">Volver al panel</Link>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame title={`Propuestas (${sorted.length})`} back="/app/dashboard">
      <div className="p-6">
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl">
              {solicitud.data ? categoryMeta(solicitud.data.category).emoji : "—"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{solicitud.data ? buildTitle(solicitud.data) : "Cargando..."}</div>
              <div className="text-[11px] text-muted-foreground">
                {sorted.length} ofertas activas{propuestas.data && propuestas.data.length !== sorted.length
                  ? ` · ${propuestas.data.length - sorted.length} cerradas`
                  : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide">Compara y elige</h3>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px]"
          >
            <option value="monto_desc">Mayor monto</option>
            <option value="tasa_asc">Menor tasa</option>
            <option value="plazo_asc">Menor plazo</option>
          </select>
        </div>

        <div className="mt-3 space-y-3">
          {propuestas.isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando propuestas...
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-xs text-muted-foreground">
              Aún no hay propuestas activas. Suelen llegar en menos de 30 minutos.
            </div>
          ) : (
            sorted.map((p) => {
              const isBest = p.id === bestId;
              return (
                <Link
                  key={p.id}
                  to="/app/proposal-detail"
                  search={{ propuesta_id: p.id }}
                  className={`block rounded-2xl border p-4 transition ${isBest ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/40"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-base font-bold uppercase">{p.business.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.business.district ?? "—"}
                      </div>
                    </div>
                    {isBest && <span className="badge-dot badge-accepted">Mejor oferta</span>}
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Te ofrecen</div>
                      <div className="font-display text-3xl font-extrabold text-primary">{formatPEN(p.monto_pen)}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Tasa <span className="font-display text-base text-foreground">{p.tasa_mensual}%</span>/mes</div>
                      <div>Plazo <span className="font-display text-base text-foreground">{p.plazo_dias}</span> días</div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="flex-1 rounded-lg border border-border bg-background py-2 text-center text-xs">Ver detalle</span>
                    <span className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${isBest ? "bg-primary text-primary-foreground" : "border border-primary/40 text-primary"}`}>Aceptar</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        <div className="mt-4 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <ArrowUpDown className="h-3 w-3" /> Ordenando por: {sort.replace("_", " ")}
        </div>
      </div>
    </PhoneFrame>
  );
}
