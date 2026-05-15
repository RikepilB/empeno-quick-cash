import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { ArrowUpDown, MapPin } from "lucide-react";

export const Route = createFileRoute("/app/proposals")({ component: Proposals });

const props = [
  { id: 1, name: "Joyería Miraflores", monto: 2400, tasa: 4.5, plazo: 30, distrito: "Miraflores", best: true },
  { id: 2, name: "Empeños Lima Centro", monto: 2200, tasa: 5.0, plazo: 30, distrito: "Cercado" },
  { id: 3, name: "Casa Oro Surco", monto: 2100, tasa: 4.0, plazo: 45, distrito: "Surco" },
  { id: 4, name: "Préstamos San Isidro", monto: 2000, tasa: 3.8, plazo: 30, distrito: "San Isidro" },
];

function Proposals() {
  return (
    <PhoneFrame title="Propuestas (4)" back="/app/dashboard">
      <div className="p-6">
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl">📱</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">iPhone 14 Pro 256GB</div>
              <div className="text-[11px] text-muted-foreground">4 ofertas recibidas</div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-wide">Compara y elige</h3>
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px]">
            <ArrowUpDown className="h-3 w-3" /> Mayor monto
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {props.map((p) => (
            <Link key={p.id} to="/app/proposal-detail" className={`block rounded-2xl border p-4 transition ${p.best ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/40"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base font-bold uppercase">{p.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {p.distrito}
                  </div>
                </div>
                {p.best && <span className="badge-dot badge-accepted">Mejor oferta</span>}
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Te ofrecen</div>
                  <div className="font-display text-3xl font-extrabold text-primary">S/ {p.monto.toLocaleString()}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Tasa <span className="font-display text-base text-foreground">{p.tasa}%</span>/mes</div>
                  <div>Plazo <span className="font-display text-base text-foreground">{p.plazo}</span> días</div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <span className="flex-1 rounded-lg border border-border bg-background py-2 text-center text-xs">Ver detalle</span>
                <span className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold ${p.best ? "bg-primary text-primary-foreground" : "border border-primary/40 text-primary"}`}>Aceptar</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
