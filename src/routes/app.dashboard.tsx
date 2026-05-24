import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import {
  Plus,
  Clock,
  Sparkles,
  History as HistoryIcon,
  Bell,
  Loader2,
  ArrowRight,
  Mail,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listMySolicitudes, type SolicitudListItem } from "@/services/solicitudes";
import { listMyClientOperations } from "@/services/operations";
import { getCurrentUser } from "@/services/auth";
import { categoryMeta, buildTitle } from "@/lib/categories";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function statusBadge(s: SolicitudListItem): { label: string; badge: string } {
  if (s.status === "accepted") return { label: "Aceptado", badge: "badge-new" };
  if (s.status === "closed") return { label: "Cerrado", badge: "badge-inactive" };
  if (s.status === "expired") return { label: "Expirado", badge: "badge-inactive" };
  if (s.propuestas_count > 0) return { label: "Con propuestas", badge: "badge-accepted" };
  return { label: "Esperando propuestas", badge: "badge-pending" };
}

function Dashboard() {
  const user = useQuery({ queryKey: ["currentUser"], queryFn: () => getCurrentUser() });
  const solicitudes = useQuery({
    queryKey: ["mySolicitudes"],
    queryFn: () => listMySolicitudes(),
  });
  const operations = useQuery({
    queryKey: ["myClientOperations"],
    queryFn: () => listMyClientOperations(),
  });

  const items = solicitudes.data ?? [];
  const activeCount = items.filter((s) => s.status === "active" || s.status === "accepted").length;
  const totalOps = operations.data?.length ?? 0;
  const firstName = user.data?.profile.full_name?.split(" ")[0] ?? "";
  const offersCount = items.reduce((acc, s) => acc + (s.propuestas_count ?? 0), 0);
  const emailUnverified = user.data && !user.data.user.email_confirmed_at;

  const today = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <ClientLayout title={`¡Hola, ${firstName || "Cliente"}!`} subtitle={today}>
      {emailUnverified && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-amber-400" />
            <div>
              <span className="font-semibold text-amber-400">Recuerda verificar tu correo</span>
              <span className="ml-2 text-muted-foreground">
                Ve a Mi cuenta para completar el paso.
              </span>
            </div>
          </div>
          <Link to="/app/cuenta" className="btn-primary shrink-0 rounded-lg px-4 py-1.5 text-xs">
            Verificar
          </Link>
        </div>
      )}

      {/* Publish CTA */}
      <Link
        to="/app/publish"
        className="group block overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground md:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-display text-2xl font-bold uppercase leading-tight md:text-3xl">
              Empeñar un artículo
            </div>
            <div className="mt-1 text-sm opacity-80">
              Publica y recibe múltiples ofertas de casas de empeño afiliadas.
            </div>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-4 transition group-hover:rotate-90">
            <Plus className="h-7 w-7" />
          </div>
        </div>
      </Link>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Clock className="h-5 w-5 text-primary" />
          <div className="mt-3 font-display text-3xl font-extrabold">{activeCount}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            Solicitudes activas
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Sparkles className="h-5 w-5 text-primary" />
          <div className="mt-3 font-display text-3xl font-extrabold">{offersCount}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            Ofertas recibidas
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <HistoryIcon className="h-5 w-5 text-primary" />
          <div className="mt-3 font-display text-3xl font-extrabold">{totalOps}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
            Operaciones completadas
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Publications */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase">Mis publicaciones</h2>
            <Link to="/app/mis-articulos" className="text-xs text-primary hover:underline">
              Ver todos →
            </Link>
          </div>

          {solicitudes.isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <div className="font-display text-lg font-bold uppercase">
                Aún no tienes publicaciones
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Publica un artículo y comienza a recibir ofertas de casas de empeño afiliadas.
              </p>
              <Link to="/app/publish" className="btn-primary mt-5 inline-flex w-auto px-6">
                Publicar artículo
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase text-muted-foreground">
                    <th className="px-5 py-3">Artículo</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3">Ofertas</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    const { label, badge } = statusBadge(s);
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
                          <span className={`badge-dot ${badge}`}>{label}</span>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {s.propuestas_count > 0 ? s.propuestas_count : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            to={target.to}
                            search={target.search as never}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          >
                            Ver <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
            <div className="flex items-center gap-2 text-xs text-primary font-semibold uppercase tracking-wide">
              <Sparkles className="h-4 w-4" /> ¿Cómo funciona?
            </div>
            <ol className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  1
                </span>
                Publica tu artículo con fotos
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  2
                </span>
                Recibe propuestas de casas afiliadas
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  3
                </span>
                Acepta la mejor y obtén tu código
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Bell className="h-3.5 w-3.5" /> Consejo
            </div>
            <p className="mt-2 text-sm">
              Sube fotos claras y bien iluminadas para recibir mejores ofertas.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Centro de ayuda
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              ¿Tienes dudas sobre cómo funciona el proceso?
            </p>
            <Link
              to="/app/notifications"
              className="mt-3 block text-xs text-primary hover:underline"
            >
              Ver notificaciones →
            </Link>
          </div>
        </aside>
      </div>
    </ClientLayout>
  );
}
