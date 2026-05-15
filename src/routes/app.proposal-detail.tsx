import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { MapPin, Clock, Phone, Star } from "lucide-react";

export const Route = createFileRoute("/app/proposal-detail")({ component: Detail });

function Detail() {
  const monto = 2400;
  const tasa = 4.5;
  const plazo = 30;
  const total = monto + (monto * tasa) / 100;

  return (
    <PhoneFrame title="Detalle" back="/app/proposals">
      <div className="space-y-5 p-6">
        <div className="rounded-2xl border border-primary bg-primary/5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-xl font-bold uppercase">Joyería Miraflores</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> Miraflores, Lima
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-primary text-primary" /> 4.9 · 320 operaciones
              </div>
            </div>
            <span className="badge-dot badge-accepted">Mejor oferta</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Te prestamos</div>
              <div className="font-display text-4xl font-extrabold text-primary">S/ {monto.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2.5 text-sm">
            <Row k="Tasa de interés" v={`${tasa}% mensual`} />
            <Row k="Plazo del préstamo" v={`${plazo} días`} />
            <Row k="Interés total" v={`S/ ${(total - monto).toFixed(2)}`} />
            <div className="my-2 border-t border-dashed border-border" />
            <Row k="Total a devolver" v={`S/ ${total.toFixed(2)}`} highlight />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="font-display text-sm font-bold uppercase tracking-wide">Información del local</div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">Av. Larco 345, Of. 201, Miraflores</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">Lun–Sáb · 9:00 a 19:00</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-foreground">(01) 445-2210</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Link to="/app/code" className="btn-primary w-full">Aceptar esta oferta</Link>
          <Link to="/app/proposals" className="btn-ghost w-full">Volver a propuestas</Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={highlight ? "font-display text-lg font-bold text-primary" : "font-semibold"}>{v}</span>
    </div>
  );
}
