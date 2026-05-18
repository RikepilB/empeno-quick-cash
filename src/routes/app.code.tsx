import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Share2, MapPin, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { getOperationByPropuesta } from "@/server-fns/operations";
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

  const op = useQuery({
    queryKey: ["operation-by-propuesta", propuesta_id],
    queryFn: () =>
      propuesta_id ? getOperationByPropuesta({ data: { propuesta_id } }) : Promise.resolve(null),
    enabled: !!propuesta_id,
  });

  if (!propuesta_id) {
    return (
      <PhoneFrame title="Trato aceptado" back="/app/dashboard">
        <div className="p-6 text-sm text-muted-foreground">
          Esta página muestra el código de una operación aceptada. Vuelve a tu panel para ver tus tratos cerrados.
          <Link to="/app/dashboard" className="btn-primary mt-4 w-full">Volver al panel</Link>
        </div>
      </PhoneFrame>
    );
  }

  if (op.isLoading) {
    return (
      <PhoneFrame title="Trato aceptado" back="/app/dashboard">
        <div className="flex items-center justify-center p-12 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando código...
        </div>
      </PhoneFrame>
    );
  }

  if (!op.data) {
    return (
      <PhoneFrame title="Trato aceptado" back="/app/dashboard">
        <div className="p-6 text-sm text-muted-foreground">
          No encontramos la operación. Puede que aún se esté procesando.
          <Link to="/app/dashboard" className="btn-primary mt-4 w-full">Volver al panel</Link>
        </div>
      </PhoneFrame>
    );
  }

  const o = op.data;
  const total = o.propuesta.monto_pen + (o.propuesta.monto_pen * o.propuesta.tasa_mensual) / 100;
  const completed = o.status === "completed";
  const expiresAt = new Date(new Date(o.accepted_at).getTime() + o.propuesta.plazo_dias * 24 * 3600 * 1000);

  return (
    <PhoneFrame title="Trato aceptado" back="/app/dashboard">
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-accepted/15 text-status-accepted">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold uppercase">
            {completed ? "Operación cerrada" : "¡Trato aceptado!"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu acuerdo con <span className="font-semibold text-foreground">{o.propuesta.business.name}</span>{" "}
            {completed ? "fue concretado." : "está listo."}
          </p>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 via-surface to-surface p-6">
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

          <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Código único de validación</div>
          <div className="mt-2 text-center font-display text-5xl font-extrabold tracking-[0.15em] text-primary">
            {o.redemption_code}
          </div>
          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            Vigente hasta:{" "}
            <span className="font-semibold text-foreground">
              {expiresAt.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <div className="space-y-2 text-xs">
            <Row k="Artículo" v={`${categoryMeta(o.solicitud.category).emoji} ${buildTitle(o.solicitud)}`} />
            <Row k="Monto" v={formatPEN(o.propuesta.monto_pen)} />
            <Row k="Tasa" v={`${o.propuesta.tasa_mensual}%/mes`} />
            <Row k="Plazo" v={`${o.propuesta.plazo_dias} días`} />
            <Row k="Total a devolver" v={formatPEN(Math.round(total))} highlight />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-xs">
          <p className="font-semibold">📍 Presenta este código al llegar al local</p>
          <p className="mt-1 text-muted-foreground">El personal verificará el código y el artículo antes de concretar la operación.</p>
        </div>

        {o.propuesta.business.district && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="font-semibold">{o.propuesta.business.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {o.propuesta.business.district}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(o.redemption_code)}
            className="btn-ghost"
          >
            <Share2 className="h-4 w-4" /> Copiar código
          </button>
          <Link to="/app/dashboard" className="btn-primary">Listo</Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={highlight ? "font-display text-base font-bold text-primary" : "font-semibold"}>{v}</span>
    </div>
  );
}
