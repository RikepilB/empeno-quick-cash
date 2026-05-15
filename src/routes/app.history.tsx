import { createFileRoute } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";

export const Route = createFileRoute("/app/history")({ component: History });

const items = [
  { art: "Anillo de oro 18k", emoji: "💍", casa: "Joyería Miraflores", monto: 1800, vence: "12 jun 2026", estado: "Activo", badge: "badge-accepted" },
  { art: "MacBook Air M2", emoji: "💻", casa: "Casa Oro Surco", monto: 4500, vence: "10 ene 2026", estado: "Completado", badge: "badge-inactive" },
  { art: "Cadena de plata", emoji: "📿", casa: "Empeños Lima Centro", monto: 600, vence: "5 oct 2025", estado: "Vencido", badge: "badge-reported" },
  { art: "Audífonos AirPods Pro", emoji: "🎧", casa: "Préstamos San Isidro", monto: 450, vence: "20 ago 2025", estado: "Completado", badge: "badge-inactive" },
];

function History() {
  return (
    <PhoneFrame title="Historial" back="/app/dashboard">
      <div className="p-6">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {["Todos", "Activos", "Completados", "Vencidos"].map((f, i) => (
            <button key={f} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}>{f}</button>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl">{it.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{it.art}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{it.casa}</div>
                    </div>
                    <span className={`badge-dot ${it.badge} shrink-0`}>{it.estado}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Monto</div>
                      <div className="font-display text-lg font-bold">S/ {it.monto.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-muted-foreground">Vence</div>
                      <div className="text-xs">{it.vence}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
