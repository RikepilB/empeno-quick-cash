import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { CheckCircle2, AlertTriangle, Clock, User } from "lucide-react";

export const Route = createFileRoute("/negocio/propuesta")({ component: PropuestaDetalle });

function PropuestaDetalle() {
  return (
    <BusinessLayout title="Propuesta P-9819" subtitle="Aceptada por el cliente · pendiente de concretar">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-status-accepted/40 bg-status-accepted/10 p-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-status-accepted" />
              <span className="badge-dot badge-accepted">Propuesta aceptada</span>
            </div>
            <h2 className="mt-3 font-display text-3xl font-extrabold uppercase">¡Trato cerrado!</h2>
            <p className="mt-1 text-sm text-foreground/80">El cliente <span className="font-semibold">María Fernández</span> aceptó tu oferta. Espera su llegada con el código.</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-3xl">💍</div>
              <div>
                <h3 className="font-display text-xl font-bold">Anillo oro 18k con diamante 8.4g</h3>
                <div className="text-xs text-muted-foreground">Joya · Estado: Bueno</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Spec k="Monto" v="S/ 1,100" big />
              <Spec k="Tasa" v="4.0%/mes" />
              <Spec k="Plazo" v="45 días" />
              <Spec k="Total devolver" v="S/ 1,166" big />
            </div>

            <div className="mt-5 rounded-xl border border-border bg-background p-4 text-sm">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" /> Cliente
              </div>
              <div className="mt-1 font-semibold">María Fernández Castro</div>
              <div className="text-[11px] text-muted-foreground">DNI verificado · 12 operaciones previas</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-base font-bold uppercase">Instrucciones para el personal</h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><span className="font-semibold text-foreground">1.</span> Cuando el cliente llegue, pide el código <span className="font-mono font-bold text-primary">EMP-7P3R8</span>.</li>
              <li><span className="font-semibold text-foreground">2.</span> Verifica que coincida con esta operación.</li>
              <li><span className="font-semibold text-foreground">3.</span> Inspecciona el artículo y compáralo con las fotos publicadas.</li>
              <li><span className="font-semibold text-foreground">4.</span> Si todo está conforme, marca como concretada. Si no, reporta inconformidad.</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="btn-ghost text-status-reported"><AlertTriangle className="h-4 w-4" /> Reportar inconformidad</button>
            <button className="btn-primary"><CheckCircle2 className="h-4 w-4" /> Marcar como concretada</button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 via-surface to-surface p-6">
            <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
            <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

            <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Código a verificar</div>
            <div className="mt-3 text-center font-display text-5xl font-extrabold tracking-[0.15em] text-primary">EMP-7P3R8</div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-status-pending">
              <Clock className="h-3.5 w-3.5" /> Vigente hasta <span className="font-semibold">20 mayo · 18:00</span>
            </div>

            <div className="my-5 border-t border-dashed border-border" />

            <div className="space-y-2 text-xs">
              <Row k="Operación" v="P-9819" />
              <Row k="Aceptada" v="15 may · 11:42" />
              <Row k="Tiempo restante" v="4d 23h 18min" />
            </div>
          </div>

          <Link to="/negocio/propuestas" className="mt-3 block text-center text-xs text-primary hover:underline">← Volver a mis propuestas</Link>
        </aside>
      </div>
    </BusinessLayout>
  );
}

function Spec({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div className="rounded-lg bg-background p-3">
      <div className="text-[10px] uppercase text-muted-foreground">{k}</div>
      <div className={big ? "mt-0.5 font-display text-lg font-bold text-primary" : "mt-0.5 font-semibold"}>{v}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
