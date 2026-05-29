import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, Inbox, Send, Bell, LogOut, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/db/browser";
import { getBusinessContext } from "@/services/business";
import { signOut } from "@/services/auth";
import { Logo, LogoText } from "@/ui/Logo";

const nav = [
  { to: "/negocio/dashboard", label: "Panel", icon: LayoutDashboard },
  { to: "/negocio/solicitudes", label: "Solicitudes", icon: Inbox },
  { to: "/negocio/propuestas", label: "Mis propuestas", icon: Send },
  { to: "/negocio/perfil", label: "Cuenta", icon: User },
];

export function BusinessLayout({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const context = useQuery({
    queryKey: ["businessContext"],
    queryFn: () => getBusinessContext(),
    staleTime: 60_000,
  });

  async function handleLogout() {
    await signOut();
    await getSupabaseBrowser().auth.signOut();
    await router.invalidate();
    await router.navigate({ to: "/negocio/login" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <Link
            to="/negocio/dashboard"
            className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5"
          >
            <Logo size={32} className="rounded-lg" />
            <LogoText />
            <span className="ml-auto rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
              Beta
            </span>
          </Link>

          <nav className="flex-1 space-y-1 p-3">
            {nav.map((item) => {
              const active = path === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="m-3 rounded-xl border border-border bg-surface p-4">
            {context.data?.business?.verified_at ? (
              <div className="text-center text-xs">
                <p className="font-semibold text-primary">Beta — Acceso completo</p>
                <p className="mt-1 text-muted-foreground">Ofertas ilimitadas</p>
                <Link
                  to="/negocio/perfil"
                  className="mt-3 block text-xs text-primary hover:underline"
                >
                  Ver cuenta
                </Link>
              </div>
            ) : (
              <div className="text-center text-xs text-muted-foreground">
                <p className="font-semibold">Pendiente de verificación</p>
                <Link to="/negocio/perfil" className="mt-2 block text-primary hover:underline">
                  Ver cuenta →
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-2xl font-bold uppercase tracking-tight md:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <Link
              to="/negocio/notifications"
              className="rounded-xl border border-border bg-surface p-2.5 text-foreground transition hover:bg-surface-2"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <button
              onClick={handleLogout}
              className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground hover:text-foreground md:flex"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
            {actions}
          </header>

          {/* mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 md:hidden">
            {nav.map((item) => {
              const active = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
