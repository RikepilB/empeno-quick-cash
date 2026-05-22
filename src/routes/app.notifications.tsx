import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellOff } from "lucide-react";
import { PhoneFrame } from "@/ui/PhoneFrame";

export const Route = createFileRoute("/app/notifications")({ component: Notifications });

function Notifications() {
  return (
    <PhoneFrame hideHeader>
      <div className="bg-background">
        <div className="flex items-center gap-3 p-6 pb-4">
          <Link
            to="/app/dashboard"
            aria-label="Volver al panel"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-xs text-muted-foreground">Centro de</div>
            <div className="font-display text-2xl font-bold uppercase">Notificaciones</div>
          </div>
        </div>

        <div className="px-6 pb-10">
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
              <BellOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-display text-base font-bold uppercase">
              Sin notificaciones por ahora
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Aquí verás avisos de nuevas propuestas, aceptaciones y recordatorios de citas.
            </p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
