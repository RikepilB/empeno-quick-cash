import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { CheckCircle2, Bell, Eye, Loader2 } from "lucide-react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { getSolicitud } from "@/services/solicitudes";
import { categoryMeta, buildTitle, formatPEN } from "@/lib/categories";

const searchSchema = z.object({ id: z.string().uuid().optional() });

export const Route = createFileRoute("/app/published")({
  component: Published,
  validateSearch: searchSchema,
});

function Published() {
  const { id } = useSearch({ from: "/app/published" });

  const { data, isLoading } = useQuery({
    queryKey: ["solicitud", id],
    queryFn: () => (id ? getSolicitud({ data: { id } }) : Promise.resolve(null)),
    enabled: !!id,
  });

  return (
    <ClientLayout
      title="Publicación activa"
      subtitle="Tu artículo está siendo visto por casas de empeño"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Success banner */}
        <div className="flex items-start gap-4 rounded-2xl border border-status-accepted/30 bg-status-accepted/10 p-5">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-status-accepted" />
          <div>
            <div className="font-display text-xl font-bold uppercase text-status-accepted">
              ¡Publicado!
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Las casas de empeño afiliadas ya pueden ver tu solicitud.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Vista previa de tu publicación
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            {isLoading || !data ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-3xl">
                    {categoryMeta(data.category).emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-bold leading-tight">
                      {buildTitle(data)}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {[data.brand, data.year, `Estado: ${data.condition ?? "—"}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Distrito: {data.district ?? "—"} · Plazo: {data.expected_term_days ?? "—"}{" "}
                      días
                    </div>
                  </div>
                </div>
                {data.photos.length > 0 && (
                  <div className="mt-4 flex gap-2">
                    {data.photos.slice(0, 4).map((p) => (
                      <img
                        key={p.id}
                        src={p.signed_url}
                        alt=""
                        className="h-16 w-16 flex-1 rounded-lg bg-surface-2 object-cover"
                      />
                    ))}
                  </div>
                )}
                {data.description && (
                  <p className="mt-4 text-sm text-muted-foreground">{data.description}</p>
                )}
                {data.expected_amount_pen && (
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-background px-4 py-3 text-sm">
                    <span className="text-muted-foreground">Monto referencia</span>
                    <span className="font-display font-bold">
                      {formatPEN(data.expected_amount_pen)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Waiting indicator */}
        <div className="flex flex-col items-center text-center py-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <div className="h-4 w-4 rounded-full bg-primary" />
            </div>
          </div>
          <div className="mt-5 font-display text-2xl font-bold uppercase">Esperando propuestas</div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Las casas de empeño afiliadas pueden ver tu solicitud y enviar ofertas. Te notificaremos
            cuando lleguen.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" /> Notificaciones activadas
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {id && (
            <Link
              to="/app/proposals"
              search={{ id }}
              className="btn-primary w-full py-3 text-center"
            >
              Ver propuestas
            </Link>
          )}
          <Link to="/app/dashboard" className="btn-ghost w-full py-3 text-center">
            Volver al inicio
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
