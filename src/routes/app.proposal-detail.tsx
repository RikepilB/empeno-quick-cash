import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
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
    queryFn: () => getPropuestaForClient({ data: { propuesta_id } }),
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

  if (!propuesta.data) {
    return (
      <PhoneFrame title="Detalle" back="/app/dashboard">
        <div className="p-6 text-sm text-muted-foreground">
          No encontramos esta propuesta en tu sesión actual. Vuelve al listado para verla.
          <div className="mt-4">
            <Link to="/app/dashboard" className="btn-primary w-full">Volver al panel</Link>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const p = propuesta.data;
  const total = p.monto_pen + (p.monto_pen * p.tasa_mensual) / 100;

  return (
    <PhoneFrame title="Detalle" back="/app/proposals">
      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-primary bg-primary/5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-xl font-bold uppercase">{p.business.name}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {p.business.district ?? "—"}
              </div>
            </div>
            <span className="badge-dot badge-accepted">Pendiente</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Te prestamos</div>
              <div className="font-display text-4xl font-extrabold text-primary">{formatPEN(p.monto_pen)}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2.5 text-sm">
            <Row k="Tasa de interés" v={`${p.tasa_mensual}% mensual`} />
            <Row k="Plazo del préstamo" v={`${p.plazo_dias} días`} />
            <Row k="Interés total" v={formatPEN(Math.round(total - p.monto_pen))} />
            <div className="my-2 border-t border-dashed border-border" />
            <Row k="Total a devolver" v={formatPEN(Math.round(total))} highlight />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => accept.mutate()}
            disabled={accept.isPending || reject.isPending}
            className="btn-primary w-full disabled:opacity-60"
          >
            {accept.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {accept.isPending ? "Aceptando..." : "Aceptar esta oferta"}
          </button>
          <button
            onClick={() => reject.mutate()}
            disabled={accept.isPending || reject.isPending}
            className="btn-ghost w-full"
          >
            Rechazar
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={highlight ? "font-display text-lg font-bold text-primary" : "font-semibold"}>{v}</span>
    </div>
  );
}
