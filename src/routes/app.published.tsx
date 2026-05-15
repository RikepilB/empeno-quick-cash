import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { CheckCircle2, Bell, Eye } from "lucide-react";

export const Route = createFileRoute("/app/published")({ component: Published });

function Published() {
  return (
    <PhoneFrame title="Publicación activa" back="/app/dashboard">
      <div className="p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-status-accepted/30 bg-status-accepted/10 p-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-status-accepted" />
          <div>
            <div className="font-display text-lg font-bold uppercase text-status-accepted">¡Publicado!</div>
            <p className="text-xs text-foreground/80">Las casas de empeño afiliadas ya pueden ver tu solicitud.</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Vista previa pública
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-3xl">📱</div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold leading-tight">iPhone 14 Pro 256GB</div>
                <div className="text-xs text-muted-foreground">Apple · 2023 · Estado: Bueno</div>
                <div className="mt-1 text-xs text-muted-foreground">Distrito: Surquillo · Plazo: 30 días</div>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 flex-1 rounded-lg bg-surface-2 text-center leading-[3rem]">📱</div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">"Ligero rayón en el marco superior. Pantalla y batería en perfecto estado."</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
              <div className="h-3 w-3 rounded-full bg-primary" />
            </div>
          </div>
          <div className="mt-4 font-display text-xl font-bold uppercase">Esperando propuestas</div>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Te avisaremos por notificación apenas recibas la primera oferta. Generalmente en menos de 30 minutos.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Bell className="h-3 w-3" /> Notificaciones activadas
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <Link to="/app/proposals" className="btn-primary w-full">Ver propuestas (demo)</Link>
          <Link to="/app/dashboard" className="btn-ghost w-full">Volver al inicio</Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
