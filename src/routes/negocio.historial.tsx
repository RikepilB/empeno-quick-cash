import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";

export const Route = createFileRoute("/negocio/historial")({ component: Historial });

const items = [
  { fecha: "15 may", art: "Anillo oro 18k 8.4g", emoji: "💍", monto: 1100, tasa: 4.0, plazo: 45, vence: "29 jun", estado: "Activa", badge: "badge-accepted" },
  { fecha: "8 may", art: "Cadena plata 925", emoji: "📿", monto: 580, tasa: 5.5, plazo: 30, vence: "7 jun", estado: "Activa", badge: "badge-accepted" },
  { fecha: "2 may", art: "iPhone 13 128GB", emoji: "📱", monto: 1900, tasa: 4.5, plazo: 30, vence: "1 jun", estado: "Concretada", badge: "badge-inactive" },
  { fecha: "28 abr", art: "Reloj Casio G-Shock", emoji: "⌚", monto: 350, tasa: 6.0, plazo: 30, vence: "—", estado: "Rechazada", badge: "badge-reported" },
  { fecha: "22 abr", art: "Pulsera oro 14k", emoji: "📿", monto: 750, tasa: 5.0, plazo: 30, vence: "22 may", estado: "Vencida", badge: "badge-inactive" },
  { fecha: "15 abr", art: "Samsung Galaxy S23", emoji: "📱", monto: 1700, tasa: 4.5, plazo: 30, vence: "—", estado: "Concretada", badge: "badge-inactive" },
];

function Historial() {
  return (
    <BusinessLayout title="Historial de operaciones" subtitle="Todas las operaciones del negocio">
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Stat label="Activas (en garantía)" value="2" tone="primary" />
        <Stat label="Concretadas" value="14" />
        <Stat label="Rechazadas" value="1" />
        <Stat label="Vencidas" value="3" />
      </div>

      <div className="mb-4 flex gap-2">
        {["Todas", "Activas", "Concretadas", "Rechazadas", "Vencidas"].map((f, i) => (
          <button key={f} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs ${i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}>{f}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-[11px] uppercase text-muted-foreground">
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Artículo</th>
              <th className="px-5 py-3">Monto</th>
              <th className="px-5 py-3">Tasa / Plazo</th>
              <th className="px-5 py-3">Vence</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx} className="border-b border-border last:border-0 hover:bg-surface-2">
                <td className="px-5 py-4 text-muted-foreground">{i.fecha}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-lg">{i.emoji}</div>
                    <span className="font-semibold">{i.art}</span>
                  </div>
                </td>
                <td className="px-5 py-4 font-display font-bold">S/ {i.monto.toLocaleString()}</td>
                <td className="px-5 py-4">{i.tasa}% · {i.plazo}d</td>
                <td className="px-5 py-4 text-muted-foreground">{i.vence}</td>
                <td className="px-5 py-4"><span className={`badge-dot ${i.badge}`}>{i.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BusinessLayout>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "primary" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-surface"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold">{value}</div>
    </div>
  );
}
