import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import {
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  Loader2,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
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
      <ClientLayout title="Mis artículos" subtitle="Todas tus publicaciones">
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Mis artículos" subtitle="Todas tus publicaciones">
      <div className="space-y-8">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <div className="mt-4 font-display text-2xl font-bold uppercase">
              Aún no tienes publicaciones
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Publica un artículo y comienza a recibir ofertas de casas de empeno afiliadas.
            </p>
            <Link to="/app/publish" className="btn-primary mt-6 inline-flex">
              <Plus className="mr-2 h-4 w-4" /> Publicar artículo
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm uppercase tracking-wide text-muted-foreground">
                    Mis publicaciones ({active.length})
                  </div>
                  <Link to="/app/publish" className="btn-primary inline-flex text-sm">
                    <Plus className="mr-1.5 h-4 w-4" /> Nueva publicación
                  </Link>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase text-muted-foreground">
                        <th className="px-5 py-3">Artículo</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Monto ref.</th>
                        <th className="px-5 py-3">Plazo</th>
                        <th className="px-5 py-3">Distrito</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
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
                          <tr
                            key={s.id}
                            className="border-b border-border last:border-0 hover:bg-surface-2"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xl">
                                  {categoryMeta(s.category).emoji}
                                </div>
                                <span className="font-semibold">{buildTitle(s)}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`badge-dot ${si.badge}`}>{si.label}</span>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                              {s.expected_amount_pen ? formatPEN(s.expected_amount_pen) : "—"}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                              {s.expected_term_days ? `${s.expected_term_days} días` : "—"}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">{s.district ?? "—"}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to="/app/publish"
                                  search={{ edit: s.id }}
                                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5 inline mr-1" />
                                  Editar
                                </Link>
                                <Link
                                  to={target.to}
                                  search={target.search as never}
                                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                                >
                                  <Icon className="h-3.5 w-3.5 inline mr-1" />
                                  Ver
                                </Link>
                                {isDeletable ? (
                                  <button
                                    type="button"
                                    onClick={() => deleteMut.mutate(s.id)}
                                    disabled={deleteMut.isPending}
                                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-2 hover:text-status-reported"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                                    {deleteMut.isPending && s.id === deleteMut.variables
                                      ? "Eliminando..."
                                      : "Eliminar"}
                                  </button>
                                ) : (
                                  <span className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground/40">
                                    <XCircle className="h-3.5 w-3.5 inline mr-1" />
                                    No editable
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {borrados.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <Trash2 className="h-3.5 w-3.5" /> Papelera ({borrados.length}) · Se elimina en
                  24h
                </div>
                <div className="overflow-hidden rounded-2xl border border-dashed border-border bg-surface">
                  <table className="w-full text-sm">
                    <tbody>
                      {borrados.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-dashed border-border last:border-0"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-lg opacity-60">
                                {categoryMeta(s.category).emoji}
                              </div>
                              <div>
                                <div className="text-sm font-semibold line-through opacity-60">
                                  {buildTitle(s)}
                                </div>
                                <span className="badge-dot badge-inactive">En papelera</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => restoreMut.mutate(s.id)}
                              disabled={restoreMut.isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-surface-2 transition"
                            >
                              <RotateCcw className="h-3 w-3" />
                              {restoreMut.isPending && s.id === restoreMut.variables
                                ? "Restaurando..."
                                : "Restaurar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </ClientLayout>
  );
}
