import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
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
  const search = useSearch({ from: "/app/published" });
  const id = search.id;

  const { data, isLoading } = useQuery({
    queryKey: ["solicitud", id],
    queryFn: () => (id ? getSolicitud({ data: { id } }) : Promise.resolve(null)),
    enabled: !!id,
  });

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
            {isLoading || !data ? (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-3xl">
                    {categoryMeta(data.category).emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-bold leading-tight">{buildTitle(data)}</div>
                    <div className="text-xs text-muted-foreground">
                      {[data.brand, data.year, `Estado: ${data.condition ?? "—"}`].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Distrito: {data.district ?? "—"} · Plazo: {data.expected_term_days ?? "—"} días
                    </div>
                  </div>
                </div>
                {data.photos.length > 0 && (
                  <div className="mt-3 flex gap-1.5">
                    {data.photos.slice(0, 4).map((p) => (
                      <img
                        key={p.id}
                        src={p.public_url}
                        alt=""
                        className="h-12 flex-1 rounded-lg bg-surface-2 object-cover"
                      />
                    ))}
                  </div>
                )}
                {data.description && (
                  <p className="mt-3 text-xs text-muted-foreground">{data.description}</p>
                )}
                {data.expected_amount_pen && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs">
                    <span className="text-muted-foreground">Monto referencia</span>
                    <span className="font-display font-bold">{formatPEN(data.expected_amount_pen)}</span>
                  </div>
                )}
              </>
            )}
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
            Las casas de empeño afiliadas pueden ver tu solicitud y enviar ofertas. Revisa tu panel para verlas.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Bell className="h-3 w-3" /> Notificaciones activadas
          </div>
        </div>

        <div className="mt-8 space-y-2">
          {id && (
            <Link to="/app/proposals" search={{ id }} className="btn-primary w-full">
              Ver propuestas
            </Link>
          )}
          <Link to="/app/dashboard" className="btn-ghost w-full">Volver al inicio</Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
