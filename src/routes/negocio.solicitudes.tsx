import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { Filter, MapPin, Clock, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/negocio/solicitudes")({ component: Solicitudes });

const items = [
  { id: "S-4231", art: "iPhone 14 Pro 256GB", emoji: "📱", cat: "Celular", estado: "Bueno", monto: 2500, plazo: 30, distrito: "Surquillo", propuestas: 0, time: "hace 5 min", isNew: true },
  { id: "S-4230", art: "Reloj Tissot PRX Powermatic 80", emoji: "⌚", cat: "Reloj", estado: "Bueno", monto: 1800, plazo: 30, distrito: "San Borja", propuestas: 2, time: "hace 22 min" },
  { id: "S-4229", art: "Cadena oro 18k 12g", emoji: "📿", cat: "Joya", estado: "Nuevo", monto: null, plazo: 30, distrito: "Lince", propuestas: 1, time: "hace 45 min" },
  { id: "S-4228", art: "Anillo oro 18k con diamante 8.4g", emoji: "💍", cat: "Joya", estado: "Bueno", monto: 1200, plazo: 45, distrito: "Miraflores", propuestas: 4, time: "hace 1 h" },
  { id: "S-4225", art: "MacBook Pro M2 14\" 512GB", emoji: "💻", cat: "Laptop", estado: "Bueno", monto: 5500, plazo: 60, distrito: "San Isidro", propuestas: 1, time: "hace 2 h" },
  { id: "S-4220", art: "Toyota Yaris 2018", emoji: "🚗", cat: "Vehículo", estado: "Regular", monto: 12000, plazo: 60, distrito: "Surco", propuestas: 0, time: "hace 3 h", isNew: true },
];

function Solicitudes() {
  return (
    <BusinessLayout title="Solicitudes" subtitle={`${items.length} solicitudes activas en este momento`}>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs">
          <Filter className="h-3.5 w-3.5" /> Filtros
        </button>
        {["Categoría: Todas", "Monto: S/ 0 – 10,000", "Plazo: Cualquiera", "Distrito: Todos"].map((c) => (
          <span key={c} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">{c}</span>
        ))}
        <div className="ml-auto flex gap-2">
          <select className="rounded-xl border border-border bg-surface px-3 py-2 text-xs">
            <option>Más recientes</option>
            <option>Mayor monto esperado</option>
            <option>Menos propuestas recibidas</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((s) => (
          <Link key={s.id} to="/negocio/solicitud" className="group flex flex-col rounded-2xl border border-border bg-surface p-5 transition hover:border-primary/40">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-2xl">{s.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {s.isNew && <span className="badge-dot badge-new">Nueva</span>}
                  <span className="text-[11px] uppercase text-muted-foreground">{s.cat}</span>
                </div>
                <div className="mt-1 line-clamp-2 font-display text-base font-bold leading-tight">{s.art}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{s.id} · Estado: {s.estado}</div>
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Monto referencia</div>
                {s.monto ? (
                  <div className="font-display text-xl font-bold">S/ {s.monto.toLocaleString()}</div>
                ) : (
                  <span className="badge-dot badge-inactive">Sin precio ref.</span>
                )}
              </div>
              <div className="space-y-1 text-right text-[11px] text-muted-foreground">
                <div className="flex items-center justify-end gap-1"><Clock className="h-3 w-3" /> {s.plazo} días · {s.time}</div>
                <div className="flex items-center justify-end gap-1"><MapPin className="h-3 w-3" /> {s.distrito}</div>
                <div className="flex items-center justify-end gap-1"><Users className="h-3 w-3" /> {s.propuestas} {s.propuestas === 1 ? "propuesta" : "propuestas"}</div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-background px-3 py-2 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground">
              Ver detalle y enviar propuesta <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </BusinessLayout>
  );
}
