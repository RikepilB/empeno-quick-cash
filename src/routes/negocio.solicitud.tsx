import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { useState } from "react";
import { MapPin, Clock, Users, FileText, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/negocio/solicitud")({ component: SolicitudDetalle });

function SolicitudDetalle() {
  const [monto, setMonto] = useState(2400);
  const [tasa, setTasa] = useState(4.5);
  const [plazo, setPlazo] = useState(30);
  const [sent, setSent] = useState(false);

  const total = monto + (monto * tasa) / 100;

  return (
    <BusinessLayout title="Solicitud S-4231" subtitle="Publicada hace 5 minutos · 0 propuestas recibidas">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Photos */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2 row-span-2 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-surface-2 to-background text-7xl">📱</div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-surface-2 text-2xl">📱</div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge-dot badge-new">Nueva</span>
                <h2 className="mt-2 font-display text-2xl font-bold uppercase">iPhone 14 Pro · 256 GB</h2>
                <div className="mt-1 text-sm text-muted-foreground">Categoría: Celular · Estado: <span className="text-foreground">Bueno</span></div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Surquillo</div>
                <div className="mt-1 flex items-center gap-1"><Users className="h-3 w-3" /> 0 propuestas</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <Spec k="Marca" v="Apple" />
              <Spec k="Modelo" v="iPhone 14 Pro" />
              <Spec k="Año" v="2023" />
              <Spec k="Almacenamiento" v="256 GB" />
              <Spec k="Color" v="Morado profundo" />
              <Spec k="Batería" v="91%" />
              <Spec k="Caja" v="Sí" />
              <Spec k="Factura" v="Sí" />
            </div>

            <div className="mt-5">
              <div className="text-[11px] uppercase text-muted-foreground">Imperfecciones declaradas</div>
              <p className="mt-1 text-sm">Ligero rayón en el marco superior. Pantalla y batería en perfecto estado. Incluye caja original, cable y factura de Plaza Vea.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Monto esperado</div>
                <div className="font-display text-2xl font-bold">S/ 2,500</div>
              </div>
              <div>
                <div className="text-[11px] uppercase text-muted-foreground">Plazo solicitado</div>
                <div className="font-display text-2xl font-bold">30 días</div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-xs">
              <FileText className="h-4 w-4 text-primary" />
              <span>Documento adjunto: <span className="font-semibold">factura_apple.pdf</span></span>
            </div>
          </div>
        </div>

        {/* Proposal form */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {sent ? (
            <div className="rounded-2xl border border-status-accepted/40 bg-status-accepted/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-status-accepted" />
              <div className="mt-3 font-display text-xl font-bold uppercase text-status-accepted">¡Propuesta enviada!</div>
              <p className="mt-1 text-xs text-muted-foreground">El cliente recibirá la notificación al instante.</p>
              <div className="mt-4 rounded-lg bg-background p-3 text-xs">
                Te quedan <span className="font-display text-base font-bold text-primary">21</span> propuestas este mes.
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to="/negocio/propuestas" className="btn-ghost text-xs">Ver mis propuestas</Link>
                <Link to="/negocio/solicitudes" className="btn-primary text-xs">Otra solicitud</Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-primary/40 bg-surface p-5">
              <h3 className="font-display text-lg font-bold uppercase">Enviar propuesta</h3>
              <p className="text-xs text-muted-foreground">Tu nombre será visible para el cliente.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="label-field">Monto a prestar (S/) *</label>
                  <input type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value))} className="input-field font-display text-lg font-bold" />
                </div>
                <div>
                  <label className="label-field">Tasa interés mensual (%) *</label>
                  <input type="number" step="0.1" value={tasa} onChange={(e) => setTasa(Number(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="label-field">Plazo</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((d) => (
                      <button key={d} onClick={() => setPlazo(d)} className={`rounded-lg border py-2 text-xs ${plazo === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-field">Nota para el cliente (opcional)</label>
                  <textarea className="input-field min-h-[60px] text-sm" placeholder="Ej: Presentar artículo con caja original." />
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total a devolver</span>
                    <Clock className="h-3 w-3" />
                  </div>
                  <div className="mt-1 font-display text-3xl font-extrabold text-primary">S/ {total.toFixed(2)}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Interés: S/ {(total - monto).toFixed(2)} · {plazo} días</div>
                </div>

                <button onClick={() => setSent(true)} className="btn-primary w-full">
                  <Send className="h-4 w-4" /> Enviar propuesta
                </button>
              </div>
            </div>
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
