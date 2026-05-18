import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { CheckCircle2, AlertTriangle, Clock, User, Loader2 } from "lucide-react";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyPropuestas, type PropuestaForBusiness } from "@/server-fns/propuestas";
import { markOperationCompleted } from "@/server-fns/operations";
import { buildTitle, categoryMeta, formatPEN } from "@/lib/categories";

const searchSchema = z.object({ id: z.string().uuid() });

export const Route = createFileRoute("/negocio/propuesta")({
  component: PropuestaDetalle,
  validateSearch: searchSchema,
});

function PropuestaDetalle() {
  const { id } = useSearch({ from: "/negocio/propuesta" });
  const queryClient = useQueryClient();
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // We piggy-back on listMyPropuestas — RLS filters to this business. Cache hit common.
  const propuestas = useQuery({ queryKey: ["myPropuestas"], queryFn: () => listMyPropuestas() });
  const propuesta: PropuestaForBusiness | undefined = useMemo(
    () => propuestas.data?.find((p) => p.id === id),
    [propuestas.data, id],
  );

  const complete = useMutation({
    mutationFn: (code: string) =>
      markOperationCompleted({
        data: { operation_id: propuesta!.operation!.id, redemption_code: code },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["myPropuestas"] });
      await queryClient.invalidateQueries({ queryKey: ["myBusinessOperations"] });
      setError(null);
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Error"),
  });

  if (propuestas.isLoading) {
    return (
      <BusinessLayout title="Cargando" subtitle="">
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
        </div>
      </BusinessLayout>
    );
  }

  if (!propuesta || !propuesta.operation) {
    return (
      <BusinessLayout title="Propuesta" subtitle="">
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
          Esta propuesta aún no fue aceptada por el cliente o no tiene operación asociada.
        </div>
        <Link to="/negocio/propuestas" className="mt-4 inline-block text-xs text-primary hover:underline">
          ← Volver a mis propuestas
        </Link>
      </BusinessLayout>
    );
  }

  const op = propuesta.operation;
  const completed = op.status === "completed";
  const total = propuesta.monto_pen + (propuesta.monto_pen * propuesta.tasa_mensual) / 100;
  const expiresAt = new Date(new Date(op.accepted_at).getTime() + propuesta.plazo_dias * 24 * 3600 * 1000);

  return (
    <BusinessLayout
      title={buildTitle({ ...propuesta.solicitud_summary })}
      subtitle={completed ? "Operación concretada" : "Aceptada por el cliente · pendiente de concretar"}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <div className={`rounded-2xl border p-5 ${completed ? "border-status-inactive/40 bg-surface" : "border-status-accepted/40 bg-status-accepted/10"}`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`h-5 w-5 ${completed ? "text-muted-foreground" : "text-status-accepted"}`} />
              <span className={`badge-dot ${completed ? "badge-inactive" : "badge-accepted"}`}>
                {completed ? "Concretada" : "Propuesta aceptada"}
              </span>
            </div>
            <h2 className="mt-3 font-display text-3xl font-extrabold uppercase">
              {completed ? "Operación cerrada" : "¡Trato cerrado!"}
            </h2>
            <p className="mt-1 text-sm text-foreground/80">
              {completed
                ? "Esta operación ya fue marcada como concretada."
                : "El cliente aceptó tu oferta. Espera su llegada con el código."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-3xl">
                {categoryMeta(propuesta.solicitud_summary.category).emoji}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">{buildTitle({ ...propuesta.solicitud_summary })}</h3>
                <div className="text-xs text-muted-foreground">
                  {categoryMeta(propuesta.solicitud_summary.category).label} · {propuesta.solicitud_summary.district ?? "—"}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Spec k="Monto" v={formatPEN(propuesta.monto_pen)} big />
              <Spec k="Tasa" v={`${propuesta.tasa_mensual}%/mes`} />
              <Spec k="Plazo" v={`${propuesta.plazo_dias} días`} />
              <Spec k="Total devolver" v={formatPEN(Math.round(total))} big />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="font-display text-base font-bold uppercase">Instrucciones para el personal</h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-semibold text-foreground">1.</span> Cuando el cliente llegue, pide el código{" "}
                <span className="font-mono font-bold text-primary">{op.redemption_code}</span>.
              </li>
              <li><span className="font-semibold text-foreground">2.</span> Inspecciona el artículo y compáralo con las fotos publicadas.</li>
              <li><span className="font-semibold text-foreground">3.</span> Si todo está conforme, escribe el código abajo y marca como concretada.</li>
              <li><span className="font-semibold text-foreground">4.</span> Si hay inconformidad, contacta soporte (próximamente).</li>
            </ol>
          </div>

          {!completed && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                if (!codeInput.trim()) {
                  setError("Ingresa el código que muestra el cliente.");
                  return;
                }
                complete.mutate(codeInput.trim().toUpperCase());
              }}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <label className="label-field">Verifica el código</label>
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="EMP-XXXXX"
                className="input-field font-mono uppercase tracking-widest"
              />
              {error && (
                <div className="mt-2 rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
                  {error}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button type="button" disabled className="btn-ghost text-status-reported opacity-50">
                  <AlertTriangle className="h-4 w-4" /> Reportar inconformidad
                </button>
                <button type="submit" disabled={complete.isPending} className="btn-primary disabled:opacity-60">
                  {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {complete.isPending ? "Marcando..." : "Marcar como concretada"}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 via-surface to-surface p-6">
            <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
            <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

            <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Código a verificar</div>
            <div className="mt-3 text-center font-display text-5xl font-extrabold tracking-[0.15em] text-primary">
              {op.redemption_code}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-status-pending">
              <Clock className="h-3.5 w-3.5" /> Vigente hasta{" "}
              <span className="font-semibold">
                {expiresAt.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
              </span>
            </div>

            <div className="my-5 border-t border-dashed border-border" />

            <div className="space-y-2 text-xs">
              <Row k="Operación" v={op.id.slice(0, 8).toUpperCase()} />
              <Row k="Aceptada" v={new Date(op.accepted_at).toLocaleString("es-PE")} />
              <Row k="Cliente" v={<User className="inline h-3 w-3" />} />
            </div>
          </div>

          <Link to="/negocio/propuestas" className="mt-3 block text-center text-xs text-primary hover:underline">
            ← Volver a mis propuestas
          </Link>
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
