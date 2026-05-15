import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/negocio/propuestas")({ component: MisPropuestas });

const props = [
  { id: "P-9821", art: "iPhone 14 Pro 256GB", emoji: "📱", monto: 2400, tasa: 4.5, plazo: 30, fecha: "Hoy 14:32", estado: "Pendiente", badge: "badge-pending" },
  { id: "P-9819", art: "Anillo oro 18k 8.4g", emoji: "💍", monto: 1100, tasa: 4.0, plazo: 45, fecha: "Hoy 11:05", estado: "Aceptada", badge: "badge-accepted", linkable: true },
  { id: "P-9815", art: "MacBook Pro M2 14\"", emoji: "💻", monto: 5200, tasa: 4.5, plazo: 60, fecha: "Ayer 18:40", estado: "Pendiente", badge: "badge-pending" },
  { id: "P-9810", art: "Reloj Rolex Oyster", emoji: "⌚", monto: 8500, tasa: 3.5, plazo: 60, fecha: "12 may", estado: "No seleccionada", badge: "badge-inactive" },
  { id: "P-9802", art: "PlayStation 5", emoji: "🎮", monto: 1300, tasa: 5.0, plazo: 30, fecha: "10 may", estado: "Expirada", badge: "badge-inactive" },
  { id: "P-9798", art: "Cadena de plata 925", emoji: "📿", monto: 580, tasa: 5.5, plazo: 30, fecha: "8 may", estado: "Aceptada", badge: "badge-accepted", linkable: true },
];

function MisPropuestas() {
  return (
    <BusinessLayout title="Mis propuestas" subtitle="Seguimiento de todas las propuestas enviadas">
      <div className="mb-4 flex gap-2">
        {["Todas (28)", "Pendientes (5)", "Aceptadas (3)", "No seleccionadas (12)", "Expiradas (8)"].map((f, i) => (
          <button key={f} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs ${i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase text-muted-foreground">
              <th className="px-5 py-3">Artículo</th>
              <th className="px-5 py-3">Monto</th>
              <th className="px-5 py-3">Tasa</th>
              <th className="px-5 py-3">Plazo</th>
              <th className="px-5 py-3">Fecha envío</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {props.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-xl">{p.emoji}</div>
                    <div>
                      <div className="font-semibold">{p.art}</div>
                      <div className="text-[11px] text-muted-foreground">{p.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 font-display font-bold">S/ {p.monto.toLocaleString()}</td>
                <td className="px-5 py-4">{p.tasa}%</td>
                <td className="px-5 py-4">{p.plazo}d</td>
                <td className="px-5 py-4 text-muted-foreground">{p.fecha}</td>
                <td className="px-5 py-4"><span className={`badge-dot ${p.badge}`}>{p.estado}</span></td>
                <td className="px-5 py-4 text-right">
                  {p.linkable ? (
                    <Link to="/negocio/propuesta" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      Ver código <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BusinessLayout>
  );
}
