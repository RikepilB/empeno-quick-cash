import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { MapPin, Loader2 } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptPropuesta, rejectPropuesta, getPropuestaForClient } from "@/services/propuestas";
import { formatPEN } from "@/lib/categories";

const searchSchema = z.object({ propuesta_id: z.string().uuid() });

export const Route = createFileRoute("/app/proposal-detail")({
  component: Detail,
  validateSearch: searchSchema,
});

function Detail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { propuesta_id } = useSearch({ from: "/app/proposal-detail" });
  const [error, setError] = useState<string | null>(null);

  const propuesta = useQuery({
    queryKey: ["propuesta-detail", propuesta_id],
    fn: () => getPropuestaForClient({ data: { propuesta_id } }),
  });

  const accept = useMutation({
    mutationFn: () => acceptPropuesta({ data: { propuesta_id } }),
    onSuccess: async (op) => {
      await queryClient.invalidateQueries({ queryKey: ["mySolicitudes"] });
      await queryClient.invalidateQueries({ queryKey: ["myClientOperations"] });
      await navigate({ to: "/app/code", search: { propuesta_id, operation_id: op.operation_id } });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Error al aceptar"),
  });

  const reject = useMutation({
    mutationFn: () => rejectPropuesta({ data: { propuesta_id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["propuestas"] });
      const solId = propuesta.data?.solicitud_id;
      if (solId) {
        await navigate({ to: "/app/proposals", search: { id: solId } });
      } else {
        await navigate({ to: "/app/dashboard" });
      }
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Error al rechazar"),
  });

  if (propuesta.isLoading) {
    return (
      <ClientLayout title="Detalle de propuesta" subtitle="Cargando...">
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando propuesta...
        </div>
      </ClientLayout>
    );
  }

  if (!propuesta.data) {
    return (
      <ClientLayout title="Detalle de propuesta" subtitle="No encontrada">
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <div className="font-display text-xl font-bold uppercase">Propuesta no encontrada</div>
            <p className="mt-2 text-sm text-muted-foreground">
              No encontramos esta propuesta en tu sesión actual.
            </p>
            <Link to="/app/dashboard" className="btn-primary mt-5 inline-flex">
              Volver al panel
            </Link>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const p = propuesta.data;
  const total = p.monto_pen + (p.monto_pen * p.tasa_mensual) / 100;

  return (
    <ClientLayout title="Detalle de propuesta" subtitle={p.business.name}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Business card */}
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-2xl font-bold uppercase">{p.business.name}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {p.business.district ?? "—"}
              </div>
            </div>
            <span className="badge-dot badge-pending">Pendiente</span>
          </div>
        </div>

        {/* Amount and terms */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-end justify-between border-b border-dashed border-border pb-5 mb-5">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Te prestamos</div>
              <div className="font-display text-5xl font-extrabold text-primary">
                {formatPEN(p.monto_pen)}
              </div>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <Row k="Tasa de interés" v={`${p.tasa_mensual}% mensual`} />
            <Row k="Plazo del préstamo" v={`${p.plazo_dias} días`} />
            <Row k="Interés total" v={formatPEN(Math.round(total - p.monto_pen))} />
            <div className="border-t border-dashed border-border pt-3">
              <Row k="Total a devolver" v={formatPEN(Math.round(total))} highlight />
            </div>
          </div>
        </div>

        {/* Actions */}
        {error && (
          <div className="rounded-lg bg-status-reported/15 px-4 py-3 text-sm text-status-reported">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => accept.mutate()}
            disabled={accept.isPending || reject.isPending}
            className="btn-primary w-full py-3 text-base disabled:opacity-60"
          >
            {accept.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> : null}
            {accept.isPending ? "Aceptando..." : "Aceptar esta oferta"}
          </button>
          <button
            onClick={() => reject.mutate()}
            disabled={accept.isPending || reject.isPending}
            className="btn-ghost w-full py-3 text-base"
          >
            Rechazar esta oferta
          </button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Al aceptar, la casa de empeño te contactará con el código de validación.
        </p>
      </div>
    </ClientLayout>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={highlight ? "font-display text-lg font-bold text-primary" : "font-semibold"}>
        {v}
      </span>
    </div>
  );
}
