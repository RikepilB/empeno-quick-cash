import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
import { Plus, Clock, Sparkles, History as HistoryIcon, Bell, Loader2, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listMySolicitudes, type SolicitudListItem } from "@/services/solicitudes";
import { listMyClientOperations } from "@/services/operations";
import { getCurrentUser, signOut } from "@/services/auth";
import { getSupabaseBrowser } from "@/lib/db/browser";
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
  const router = useRouter();
  const user = useQuery({ queryKey: ["currentUser"], queryFn: () => getCurrentUser() });

  async function handleLogout() {
    await signOut();
    await getSupabaseBrowser().auth.signOut();
    await router.invalidate();
    await router.navigate({ to: "/app/login" });
  }

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

  return (
    <PhoneFrame hideHeader>
      <div className="bg-background">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <div className="text-xs text-muted-foreground">¡Hola,</div>
            <div className="font-display text-2xl font-bold uppercase">
              {firstName || "Cliente"}! 👋
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/notifications"
              className="rounded-xl border border-border bg-surface p-2.5 text-foreground transition hover:bg-surface-2"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-border bg-surface p-2.5 text-muted-foreground hover:text-foreground"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6">
          <Link
            to="/app/publish"
            className="group block overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-2xl font-bold uppercase leading-tight">
                  Empeñar un artículo
                </div>
                <div className="text-xs opacity-80">Recibe ofertas en minutos</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-3 transition group-hover:rotate-90">
                <Plus className="h-6 w-6" />
              </div>
            </div>
          </Link>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-display text-base font-bold uppercase tracking-wide">
              Mis publicaciones
            </h3>
            <Link to="/app/history" className="text-xs text-primary hover:underline">
              Ver historial
            </Link>
          </div>

          <div className="mt-3 space-y-2.5">
            {solicitudes.isLoading ? (
              <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-xs text-muted-foreground">
                Aún no has publicado ningún artículo. Toca "Empeñar un artículo" para empezar.
              </div>
            ) : (
              items.map((s) => {
                const { label, badge } = statusBadge(s);
                const linkClass =
                  "flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-primary/40";
                const inner = (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl">
                      {categoryMeta(s.category).emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{buildTitle(s)}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className={`badge-dot ${badge}`}>{label}</span>
                        {s.propuestas_count > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            · {s.propuestas_count}{" "}
                            {s.propuestas_count === 1 ? "propuesta" : "propuestas"}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                );
                if (s.status === "accepted") {
                  const op = operations.data?.find((o) => o.solicitud.id === s.id);
                  const propuestaId = op?.propuesta.id;
                  if (propuestaId) {
                    return (
                      <Link
                        key={s.id}
                        to="/app/code"
                        search={{ propuesta_id: propuestaId }}
                        className={linkClass}
                      >
                        {inner}
                      </Link>
                    );
                  }
                  return (
                    <Link key={s.id} to="/app/code" className={linkClass}>
                      {inner}
                    </Link>
                  );
                }
                if (s.propuestas_count > 0) {
                  return (
                    <Link
                      key={s.id}
                      to="/app/proposals"
                      search={{ id: s.id }}
                      className={linkClass}
                    >
                      {inner}
                    </Link>
                  );
                }
                return (
                  <Link key={s.id} to="/app/published" search={{ id: s.id }} className={linkClass}>
                    {inner}
                  </Link>
                );
              })
            )}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Tip
            </div>
            <p className="mt-1 text-sm">
              Sube fotos claras y bien iluminadas para recibir mejores ofertas.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 pb-8">
            <div className="rounded-xl border border-border bg-surface p-4">
              <Clock className="h-4 w-4 text-primary" />
              <div className="mt-2 font-display text-xl font-bold">{activeCount}</div>
              <div className="text-[11px] text-muted-foreground">Empeños activos</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <HistoryIcon className="h-4 w-4 text-primary" />
              <div className="mt-2 font-display text-xl font-bold">{totalOps}</div>
              <div className="text-[11px] text-muted-foreground">Operaciones totales</div>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
