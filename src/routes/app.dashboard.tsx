import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Plus, Clock, Sparkles, History as HistoryIcon, Bell } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

const activos = [
  { id: 1, art: "iPhone 14 Pro 256GB", emoji: "📱", estado: "Con propuestas", count: 3, badge: "badge-accepted" },
  { id: 2, art: "Reloj Tissot PRX", emoji: "⌚", estado: "Esperando propuestas", count: 0, badge: "badge-pending" },
  { id: 3, art: "Anillo de oro 18k", emoji: "💍", estado: "Aceptado", count: 1, badge: "badge-new" },
];

function Dashboard() {
  return (
    <PhoneFrame hideHeader>
      <div className="bg-background">
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <div className="text-xs text-muted-foreground">¡Hola,</div>
            <div className="font-display text-2xl font-bold uppercase">María! 👋</div>
          </div>
          <button className="relative rounded-xl border border-border bg-surface p-2.5">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>

        <div className="px-6">
          <Link to="/app/publish" className="group block overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-2xl font-bold uppercase leading-tight">Empeñar un artículo</div>
                <div className="text-xs opacity-80">Recibe ofertas en minutos</div>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 p-3 transition group-hover:rotate-90"><Plus className="h-6 w-6" /></div>
            </div>
          </Link>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-display text-base font-bold uppercase tracking-wide">Mis publicaciones</h3>
            <Link to="/app/history" className="text-xs text-primary hover:underline">Ver historial</Link>
          </div>

          <div className="mt-3 space-y-2.5">
            {activos.map((p) => (
              <Link key={p.id} to={p.estado === "Con propuestas" ? "/app/proposals" : p.estado === "Aceptado" ? "/app/code" : "/app/published"} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-primary/40">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl">{p.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.art}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={`badge-dot ${p.badge}`}>{p.estado}</span>
                    {p.count > 0 && <span className="text-[11px] text-muted-foreground">· {p.count} {p.count === 1 ? "propuesta" : "propuestas"}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Tip
            </div>
            <p className="mt-1 text-sm">Sube fotos claras y bien iluminadas para recibir mejores ofertas.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 pb-8">
            <div className="rounded-xl border border-border bg-surface p-4">
              <Clock className="h-4 w-4 text-primary" />
              <div className="mt-2 font-display text-xl font-bold">2</div>
              <div className="text-[11px] text-muted-foreground">Empeños activos</div>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <HistoryIcon className="h-4 w-4 text-primary" />
              <div className="mt-2 font-display text-xl font-bold">12</div>
              <div className="text-[11px] text-muted-foreground">Operaciones totales</div>
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
