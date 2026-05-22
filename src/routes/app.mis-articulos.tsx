import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
import {
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  Loader2,
  ArrowLeft,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listMySolicitudes,
  softDeleteSolicitud,
  restoreSolicitud,
  type SolicitudListItem,
} from "@/services/solicitudes";
import { categoryMeta, buildTitle, formatPEN } from "@/lib/categories";

export const Route = createFileRoute("/app/mis-articulos")({
  component: MisArticulos,
});

type StatusInfo = {
  label: string;
  icon: typeof CheckCircle2;
  badge: string;
  color: string;
};

function statusInfo(s: SolicitudListItem): StatusInfo {
  if (s.status === "borrado") {
    const daysLeft = s.deleted_at
      ? Math.max(0, 1 - Math.floor((Date.now() - new Date(s.deleted_at).getTime()) / 86400000))
      : 1;
    return {
      label: `En papelera${daysLeft > 0 ? ` · ${daysLeft}d` : ""}`,
      icon: Trash2,
      badge: "badge-inactive",
      color: "text-muted-foreground",
    };
  }
  if (s.status === "accepted")
    return {
      label: "Aceptado",
      icon: CheckCircle2,
      badge: "badge-new",
      color: "text-status-accepted",
    };
  if (s.status === "closed")
    return {
      label: "Cerrado",
      icon: CheckCircle2,
      badge: "badge-inactive",
      color: "text-muted-foreground",
    };
  if (s.status === "expired")
    return {
      label: "Expirado",
      icon: Clock,
      badge: "badge-inactive",
      color: "text-muted-foreground",
    };
  if (s.propuestas_count > 0)
    return {
      label: `${s.propuestas_count} propuesta${s.propuestas_count > 1 ? "s" : ""}`,
      icon: Eye,
      badge: "badge-accepted",
      color: "text-status-accepted",
    };
  return {
    label: "Esperando",
    icon: Clock,
    badge: "badge-pending",
    color: "text-muted-foreground",
  };
}

function MisArticulos() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["mySolicitudes"],
    queryFn: () => listMySolicitudes(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => softDeleteSolicitud({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mySolicitudes"] }),
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => restoreSolicitud({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mySolicitudes"] }),
  });

  const borrados = items.filter((i) => i.status === "borrado");
  const active = items.filter((i) => i.status !== "borrado");

  if (isLoading) {
    return (
      <PhoneFrame title="Mis artículos" back="/app/dashboard">
        <div className="flex items-center justify-center p-12 text-xs text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
        </div>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame title="Mis artículos" back="/app/dashboard">
      <div className="p-6 pb-10 space-y-6">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <div className="mt-3 font-display text-lg font-bold uppercase">Sin publicaciones</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Publica un artículo para comenzar a recibir ofertas.
            </p>
            <Link to="/app/publish" className="btn-primary mt-5 inline-flex">
              Publicar artículo
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <div className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
                  Mis publicaciones ({active.length})
                </div>
                <div className="space-y-2.5">
                  {active.map((s) => {
                    const si = statusInfo(s);
                    const Icon = si.icon;
                    const isDeletable = s.status === "active" || s.status === "expired";
                    const target =
                      s.status === "accepted"
                        ? {
                            to: "/app/code" as const,
                            search: { propuesta_id: s.accepted_propuesta_id ?? undefined },
                          }
                        : s.propuestas_count > 0
                          ? { to: "/app/proposals" as const, search: { id: s.id } }
                          : { to: "/app/published" as const, search: { id: s.id } };

                    return (
                      <div
                        key={s.id}
                        className="group rounded-xl border border-border bg-surface overflow-hidden"
                      >
                        <Link
                          to={target.to}
                          search={target.search as never}
                          className="flex items-center gap-3 p-3 hover:bg-surface-2 transition"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl shrink-0">
                            {categoryMeta(s.category).emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{buildTitle(s)}</div>
                            <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                              <span className={`badge-dot ${si.badge}`}>{si.label}</span>
                              {s.expected_amount_pen && (
                                <span className="text-[11px] text-muted-foreground">
                                  {formatPEN(s.expected_amount_pen)}
                                </span>
                              )}
                              {s.expected_term_days && (
                                <span className="text-[11px] text-muted-foreground">
                                  · {s.expected_term_days} días
                                </span>
                              )}
                              {s.district && (
                                <span className="text-[11px] text-muted-foreground">
                                  · {s.district}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                        <div className="flex border-t border-border">
                          <Link
                            to="/app/publish"
                            search={{ edit: s.id }}
                            className="flex flex-1 items-center justify-center gap-1.5 border-r border-border py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                          <Link
                            to={target.to}
                            search={target.search as never}
                            className="flex flex-1 items-center justify-center gap-1.5 border-r border-border py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
                          >
                            <Icon className="h-3.5 w-3.5" />
                            Ver
                          </Link>
                          {isDeletable ? (
                            <button
                              type="button"
                              onClick={() => deleteMut.mutate(s.id)}
                              disabled={deleteMut.isPending}
                              className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-status-reported transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deleteMut.isPending && s.id === deleteMut.variables
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>
                          ) : (
                            <span className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground/40">
                              <XCircle className="h-3.5 w-3.5" />
                              No editable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {borrados.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Trash2 className="h-3.5 w-3.5" /> Papelera ({borrados.length}) · Se elimina en
                  24h
                </div>
                <div className="space-y-2">
                  {borrados.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 p-3 opacity-70"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xl shrink-0">
                        {categoryMeta(s.category).emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold line-through">
                          {buildTitle(s)}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="badge-dot badge-inactive">En papelera</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => restoreMut.mutate(s.id)}
                        disabled={restoreMut.isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2 transition shrink-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {restoreMut.isPending && s.id === restoreMut.variables
                          ? "Restaurando..."
                          : "Restaurar"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </PhoneFrame>
  );
}
