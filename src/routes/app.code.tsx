import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Share2, MapPin, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/app/code")({ component: Code });

function Code() {
  return (
    <PhoneFrame title="Trato aceptado" back="/app/dashboard">
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-accepted/15 text-status-accepted">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold uppercase">¡Trato aceptado!</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tu acuerdo con <span className="font-semibold text-foreground">Joyería Miraflores</span> está listo.</p>
        </div>

        {/* Ticket */}
        <div className="relative mt-6 overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/15 via-surface to-surface p-6">
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />

          <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">Código único de validación</div>
          <div className="mt-2 text-center font-display text-5xl font-extrabold tracking-[0.15em] text-primary">
            EMP-4X9K2
          </div>
          <div className="mt-2 text-center text-[11px] text-muted-foreground">Vigente hasta: <span className="font-semibold text-foreground">20 mayo 2026 · 18:00</span></div>

          <div className="my-4 border-t border-dashed border-border" />

          <div className="space-y-2 text-xs">
            <Row k="Artículo" v="iPhone 14 Pro 256GB" />
            <Row k="Monto" v="S/ 2,400" />
            <Row k="Tasa" v="4.5%/mes" />
            <Row k="Plazo" v="30 días" />
            <Row k="Total a devolver" v="S/ 2,508" highlight />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface p-4 text-xs">
          <p className="font-semibold">📍 Presenta este código al llegar al local</p>
          <p className="mt-1 text-muted-foreground">El personal verificará el código y el artículo antes de concretar la operación.</p>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <div className="font-semibold">Av. Larco 345, Of. 201, Miraflores</div>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> Lun–Sáb · 9:00 a 19:00
              </div>
            </div>
          </div>
          <button className="mt-3 w-full rounded-lg border border-primary bg-primary/10 py-2 text-xs font-semibold text-primary">Cómo llegar</button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button className="btn-ghost"><Share2 className="h-4 w-4" /> Compartir</button>
          <Link to="/app/dashboard" className="btn-primary">Listo</Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className={highlight ? "font-display text-base font-bold text-primary" : "font-semibold"}>{v}</span>
    </div>
  );
}
