import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { BusinessLayout } from "@/ui/BusinessLayout";
import { useState } from "react";
import { MapPin, Clock, Users, Send, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSolicitud } from "@/services/solicitudes";
import { createPropuesta } from "@/services/propuestas";
import { getBusinessContext } from "@/services/business";
import { categoryMeta, buildTitle, formatPEN } from "@/lib/categories";

const searchSchema = z.object({ id: z.string().uuid() });

export const Route = createFileRoute("/negocio/solicitud")({
  component: SolicitudDetalle,
  validateSearch: searchSchema,
});

const PLAZOS = [15, 30, 45, 60] as const;

function SolicitudDetalle() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useSearch({ from: "/negocio/solicitud" });

  const solicitud = useQuery({
    queryKey: ["solicitud", id],
    queryFn: () => getSolicitud({ data: { id } }),
  });
  const context = useQuery({ queryKey: ["businessContext"], queryFn: () => getBusinessContext() });

  const [monto, setMonto] = useState<number>(0);
  const [tasa, setTasa] = useState<number>(4.5);
  const [plazo, setPlazo] = useState<(typeof PLAZOS)[number]>(30);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: () =>
      createPropuesta({
        data: { solicitud_id: id, monto_pen: monto, tasa_mensual: tasa, plazo_dias: plazo },
      }),
    onSuccess: async () => {
      setSent(true);
      await queryClient.invalidateQueries({ queryKey: ["myPropuestas"] });
      await queryClient.invalidateQueries({ queryKey: ["businessContext"] });
      await queryClient.invalidateQueries({ queryKey: ["activeSolicitudes"] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Error al enviar propuesta"),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!monto || monto <= 0) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    send.mutate();
  };

  const total = monto + (monto * tasa) / 100;

  if (solicitud.isLoading) {
    return (
      <BusinessLayout title="Cargando solicitud" subtitle="">
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
        </div>
      </BusinessLayout>
    );
  }

  if (!solicitud.data) {
    return (
      <BusinessLayout title="Solicitud no encontrada" subtitle="">
        <Link to="/negocio/solicitudes" className="btn-primary">Volver a solicitudes</Link>
      </BusinessLayout>
    );
  }

  const s = solicitud.data;
  const remaining = context.data?.subscription?.propuestas_remaining;

  return (
    <BusinessLayout
      title={buildTitle(s)}
      subtitle={`Publicada ${new Date(s.created_at).toLocaleString("es-PE")} · ${s.propuestas_count} propuestas recibidas`}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Photos */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            {s.photos.length === 0 ? (
              <div className="rounded-xl bg-surface-2 py-10 text-center text-xs text-muted-foreground">
                Sin fotografías.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {s.photos.map((p, idx) => (
                  <img
                    key={p.id}
                    src={p.public_url}
                    alt=""
                    className={`aspect-square rounded-xl bg-surface-2 object-cover ${idx === 0 ? "col-span-2 row-span-2" : ""}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-dot badge-new">{categoryMeta(s.category).label}</span>
                <h2 className="mt-2 font-display text-2xl font-bold uppercase">{buildTitle(s)}</h2>
                <div className="mt-1 text-sm text-muted-foreground">
                  Estado: <span className="text-foreground">{s.condition ?? "—"}</span>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.district ?? "—"}</div>
                <div className="mt-1 flex items-center gap-1"><Users className="h-3 w-3" /> {s.propuestas_count} propuestas</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Spec k="Marca" v={s.brand ?? "—"} />
              <Spec k="Modelo" v={s.model ?? "—"} />
              <Spec k="Año" v={s.year?.toString() ?? "—"} />
              <Spec k="Almacenamiento" v={s.storage ?? "—"} />
            </div>

            {s.description && (
              <div className="mt-5">
                <div className="text-[11px] uppercase text-muted-foreground">Descripción del cliente</div>
                <p className="mt-1 text-sm">{s.description}</p>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Monto esperado</div>
                <div className="font-display text-2xl font-bold">{formatPEN(s.expected_amount_pen)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Plazo solicitado</div>
                <div className="font-display text-2xl font-bold">{s.expected_term_days ?? "—"} días</div>
              </div>
            </div>
          </div>
        </div>

        {/* Proposal form */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {sent ? (
            <div className="rounded-2xl border border-status-accepted/40 bg-status-accepted/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-status-accepted" />
              <div className="mt-3 font-display text-xl font-bold uppercase text-status-accepted">¡Propuesta enviada!</div>
              <p className="mt-1 text-xs text-muted-foreground">El cliente recibirá la oferta de inmediato.</p>
              {remaining !== null && remaining !== undefined && (
                <div className="mt-4 rounded-lg bg-background p-3 text-xs">
                  Te quedan{" "}
                  <span className="font-display text-base font-bold text-primary">{Math.max(0, remaining - 1)}</span>{" "}
                  propuestas este mes.
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to="/negocio/propuestas" className="btn-ghost text-xs">Ver mis propuestas</Link>
                <button onClick={() => navigate({ to: "/negocio/solicitudes" })} className="btn-primary text-xs">
                  Otra solicitud
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="rounded-2xl border border-primary/40 bg-surface p-5">
              <h3 className="font-display text-lg font-bold uppercase">Enviar propuesta</h3>
              <p className="text-xs text-muted-foreground">Tu nombre será visible para el cliente.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="label-field">Monto a prestar (S/) *</label>
                  <input
                    type="number"
                    value={monto || ""}
                    onChange={(e) => setMonto(Number(e.target.value))}
                    className="input-field font-display text-lg font-bold"
                    placeholder={s.expected_amount_pen?.toString() ?? "0"}
                  />
                </div>
                <div>
                  <label className="label-field">Tasa interés mensual (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tasa}
                    onChange={(e) => setTasa(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Plazo</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PLAZOS.map((d) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => setPlazo(d)}
                        className={`rounded-lg border py-2 text-xs ${plazo === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total a devolver</span>
                    <Clock className="h-3 w-3" />
                  </div>
                  <div className="mt-1 font-display text-3xl font-extrabold text-primary">
                    {formatPEN(Math.round(total))}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Interés: {formatPEN(Math.round(total - monto))} · {plazo} días
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
                    {error}
                  </div>
                )}

                <button type="submit" disabled={send.isPending} className="btn-primary w-full disabled:opacity-60">
                  {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {send.isPending ? "Enviando..." : "Enviar propuesta"}
                </button>
              </div>
            </form>
          )}
        </aside>
      </div>
    </BusinessLayout>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
      <div className="mt-0.5 font-semibold">{v}</div>
    </div>
  );
}
