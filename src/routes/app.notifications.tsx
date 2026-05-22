import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BellOff } from "lucide-react";
import { ClientLayout } from "@/ui/ClientLayout";

export const Route = createFileRoute("/app/notifications")({ component: Notifications });

function Notifications() {
  return (
    <ClientLayout title="Notificaciones" subtitle="Avisos de propuestas y operaciones">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2">
            <BellOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-5 font-display text-xl font-bold uppercase">
            Sin notificaciones por ahora
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Aquí verás avisos de nuevas propuestas, aceptaciones y recordatorios de citas.
          </p>
        </div>
      </div>
    </ClientLayout>
  );
}
