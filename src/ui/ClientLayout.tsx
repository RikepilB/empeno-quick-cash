import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  Send,
  Bell,
  CreditCard,
  LogOut,
  User,
  Plus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/db/browser";
import { signOut } from "@/services/auth";
import { getCurrentUser } from "@/services/auth";
import { Logo, LogoText } from "@/ui/Logo";
import { getCurrentUser } from "@/services/auth";

const nav = [
  { to: "/app/dashboard", label: "Inicio", icon: LayoutDashboard },
  { to: "/app/mis-articulos", label: "Mis publicaciones", icon: Inbox },
  { to: "/app/history", label: "Historial", icon: FileText },
  { to: "/app/cuenta", label: "Cuenta", icon: User },
];

export function ClientLayout({
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
  const user = useQuery({ queryKey: ["currentUser"], queryFn: () => getCurrentUser() });

  async function handleLogout() {
    await signOut();
    await getSupabaseBrowser().auth.signOut();
    await router.invalidate();
    await router.navigate({ to: "/app/login" });
  }

  const firstName = user.data?.profile.full_name?.split(" ")[0] ?? "Cliente";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <Link
            to="/app/dashboard"
            className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5"
          >
            <Logo size={32} className="rounded-lg" />
            <LogoText />
            <span className="ml-auto rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
              B2C
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
            <div className="text-xs text-muted-foreground">¡Hola, {firstName}!</div>
            <Link
              to="/app/notifications"
              className="mt-3 flex items-center gap-2 text-xs text-primary hover:underline"
            >
              <Bell className="h-3.5 w-3.5" /> Notificaciones
            </Link>
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
              to="/app/publish"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Publicar artículo</span>
            </Link>
            <Link
              to="/app/notifications"
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
