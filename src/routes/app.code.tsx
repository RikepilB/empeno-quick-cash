import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { useState } from "react";
import { Share2, MapPin, Clock, CheckCircle2, Loader2, Copy } from "lucide-react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { getOperationByPropuesta } from "@/services/operations";
import { buildTitle, categoryMeta, formatPEN } from "@/lib/categories";

const searchSchema = z.object({
  propuesta_id: z.string().uuid().optional(),
  operation_id: z.string().uuid().optional(),
});

export const Route = createFileRoute("/app/code")({
  component: Code,
  validateSearch: searchSchema,
});

function Code() {
  const { propuesta_id } = useSearch({ from: "/app/code" });
  const [copied, setCopied] = useState(false);

  const op = useQuery({
    queryKey: ["operation-by-propuesta", propuesta_id],
    queryFn: () =>
      propuesta_id ? getOperationByPropuesta({ data: { propuesta_id } }) : Promise.resolve(null),
    enabled: !!propuesta_id,
  });

  if (!propuesta_id) {
    return (
      <ClientLayout title="Código de validación" subtitle="Trato aceptado">
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <div className="font-display text-xl font-bold uppercase">Código no especificado</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta página muestra el código de una operación aceptada.
            </p>
            <Link to="/app/dashboard" className="btn-primary mt-5 inline-flex">
              Volver al panel
            </Link>
          </div>
        </div>
      </ClientLayout>
    );
  }

  if (op.isLoading) {
    return (
      <ClientLayout title="Código de validación" subtitle="Trato aceptado">
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando código...
        </div>
      </ClientLayout>
    );
  }

  if (op.isError || !op.data) {
    return (
      <ClientLayout title="Código de validación" subtitle="Trato aceptado">
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <div className="font-display text-xl font-bold uppercase">
              No se encontró la operación
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              No pudimos cargar la operación. Verifica tu conexión e intenta de nuevo.
            </p>
            <button
              type="button"
              onClick={() => op.refetch()}
              className="btn-primary mt-4 inline-flex"
            >
              Reintentar
            </button>
            <Link to="/app/dashboard" className="btn-ghost mt-2 inline-flex ml-2">
              Volver al panel
            </Link>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const o = op.data;
  const total = o.propuesta.monto_pen + (o.propuesta.monto_pen * o.propuesta.tasa_mensual) / 100;
  const completed = o.status === "completed";
  const expiresAt = new Date(
    new Date(o.accepted_at).getTime() + o.propuesta.plazo_dias * 24 * 3600 * 1000,
  );

  return (
    <ClientLayout
      title={completed ? "Operación cerrada" : "¡Trato aceptado!"}
      subtitle={`Acuerdo con ${o.propuesta.business.name}`}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Status banner */}
        <div className="flex items-center gap-4 rounded-2xl border border-status-accepted/30 bg-status-accepted/10 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-accepted/15 text-status-accepted">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-lg font-bold uppercase text-status-accepted">
              {completed ? "Operación concretada" : "Acuerdo listo"}
            </div>
            <div className="text-sm text-muted-foreground">
              {completed
                ? "El trato con la casa de empeño fue concretado."
                : "Tu código de validación está listo. Preséntalo al llegar al local."}
            </div>
          </div>
        </div>

        {/* Redemption code card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 via-surface to-surface p-8 text-center">
          <div className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background" />
          <div className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background" />

          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Código único de validación
          </div>
          <div className="mt-3 text-center font-display text-6xl font-extrabold tracking-[0.15em] tabular-nums text-primary">
            {o.redemption_code}
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Vigente hasta el{" "}
            <span className="font-semibold text-foreground">
              {expiresAt.toLocaleDateString("es-PE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="font-display text-lg font-bold uppercase mb-4">Detalles del trato</div>
            <div className="space-y-3 text-sm">
              <Row
                k="Artículo"
                v={`${categoryMeta(o.solicitud.category).emoji} ${buildTitle(o.solicitud)}`}
              />
              <Row k="Monto prestado" v={formatPEN(o.propuesta.monto_pen)} />
              <Row k="Tasa" v={`${o.propuesta.tasa_mensual}%/mes`} />
              <Row k="Plazo" v={`${o.propuesta.plazo_dias} días`} />
              <div className="border-t border-dashed border-border pt-3">
                <Row k="Total a devolver" v={formatPEN(Math.round(total))} highlight />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-semibold text-sm">📍 Presenta este código al llegar al local</p>
              <p className="mt-2 text-sm text-muted-foreground">
                El personal verificará el código y el artículo antes de concreta la operación.
              </p>
            </div>

            {o.propuesta.business.district && (
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{o.propuesta.business.name}</div>
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {o.propuesta.business.district}
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${o.propuesta.business.name} ${o.propuesta.business.district}`,
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      Abrir en Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(o.redemption_code).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="btn-ghost flex-1"
              >
                <Copy className="mr-2 h-4 w-4" /> {copied ? "¡Copiado!" : "Copiar código"}
              </button>
              <Link to="/app/dashboard" className="btn-primary flex-1 text-center">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span
        className={highlight ? "font-display text-base font-bold text-primary" : "font-semibold"}
      >
        {v}
      </span>
    </div>
  );
}
