import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  Send,
  History,
  Settings,
  Bell,
  CreditCard,
  Search,
} from "lucide-react";

const nav = [
  { to: "/negocio/dashboard", label: "Panel", icon: LayoutDashboard },
  { to: "/negocio/solicitudes", label: "Solicitudes", icon: Inbox },
  { to: "/negocio/propuestas", label: "Mis propuestas", icon: Send },
  { to: "/negocio/historial", label: "Historial", icon: History },
  { to: "/negocio/perfil", label: "Negocio", icon: Settings },
];

export function BusinessLayout({ children, title, subtitle, actions }: { children: ReactNode; title: string; subtitle?: string; actions?: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
          <Link to="/negocio/dashboard" className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">E</div>
            <span className="font-display text-lg font-bold tracking-wider">EMPEÑALO</span>
            <span className="ml-auto rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">B2B</span>
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" /> Plan Intermedio
            </div>
            <div className="mt-2 flex items-end justify-between">
              <span className="font-display text-2xl font-bold">8/30</span>
              <span className="text-[10px] uppercase text-muted-foreground">propuestas</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-primary" style={{ width: "27%" }} />
            </div>
            <Link to="/negocio/perfil" className="mt-3 block text-center text-xs text-primary hover:underline">
              Cambiar plan
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-8">
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-2xl font-bold uppercase tracking-tight md:text-3xl">{title}</h1>
              {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 lg:flex">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="w-56 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none" placeholder="Buscar solicitudes..." />
            </div>
            <button className="relative rounded-xl border border-border bg-surface p-2.5">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="hidden items-center gap-3 rounded-xl border border-border bg-surface px-3 py-1.5 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 font-display font-bold text-primary">JM</div>
              <div className="text-xs leading-tight">
                <div className="font-semibold">Joyería Miraflores</div>
                <div className="text-muted-foreground">Admin</div>
              </div>
            </div>
            {actions}
          </header>

          {/* mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2 md:hidden">
            {nav.map((item) => {
              const active = path === item.to;
              return (
                <Link key={item.to} to={item.to} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
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
