import { createFileRoute } from "@tanstack/react-router";
import { BellOff } from "lucide-react";
import { BusinessLayout } from "@/ui/BusinessLayout";

export const Route = createFileRoute("/negocio/notifications")({ component: BizNotifications });

function BizNotifications() {
  return (
    <BusinessLayout title="Notificaciones" subtitle="Avisos de solicitudes, propuestas y citas">
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
          <BellOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mt-5 font-display text-lg font-bold uppercase">
          Sin notificaciones por ahora
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aquí verás avisos cuando llegue una nueva solicitud en tu zona o un cliente acepte tu
          propuesta.
        </p>
      </div>
    </BusinessLayout>
  );
}
