import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

export const Route = createFileRoute("/negocio/plan")({ component: PlanPage });

const plans = [
  {
    name: "Básico",
    price: 10,
    ofertas: "5 ofertas/mes",
    features: ["Acceso al marketplace", "Notificaciones básicas", "Soporte por correo"],
  },
  {
    name: "Intermedio",
    price: 20,
    ofertas: "30 ofertas/mes",
    popular: true,
    features: [
      "Herramientas de gestión",
      "Reportes mensuales",
      "Soporte prioritario",
      "Múltiples filtros",
    ],
  },
  {
    name: "Avanzado",
    price: 30,
    ofertas: "Ofertas ilimitadas",
    features: [
      "Prioridad en solicitudes",
      "Alertas por categoría",
      "Múltiples usuarios",
      "Soporte dedicado",
      "API (próximamente)",
    ],
  },
];

const compareRows = [
  { l: "Ofertas mensuales", v: ["5", "30", "Ilimitadas"] },
  { l: "Acceso a solicitudes", v: [true, true, true] },
  { l: "Herramientas de gestión", v: [false, true, true] },
  { l: "Reportes mensuales", v: [false, true, true] },
  { l: "Prioridad en solicitudes nuevas", v: [false, false, true] },
  { l: "Alertas por categoría", v: [false, false, true] },
  { l: "Múltiples usuarios", v: [false, false, true] },
];

function PlanPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="badge-dot badge-accepted">✓ Negocio aprobado</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold uppercase md:text-5xl">
            Elige tu plan
          </h1>
          <p className="mt-2 text-muted-foreground">
            Comienza desde S/ 10 al mes. Cambia cuando quieras.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 ${p.popular ? "border-primary bg-primary/5 md:scale-105" : "border-border bg-surface"}`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
                  Más popular
                </span>
              )}
              <div className="font-display text-xl font-bold uppercase">{p.name}</div>
              <div className="mt-2 flex items-end gap-1">
                <span className="font-display text-5xl font-extrabold">S/ {p.price}</span>
                <span className="pb-2 text-sm text-muted-foreground">/mes</span>
              </div>
              <div className="mt-1 text-xs font-semibold uppercase text-primary">{p.ofertas}</div>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/negocio/dashboard"
                className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold ${p.popular ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-surface-2"}`}
              >
                Seleccionar {p.name}
              </Link>
            </div>
          ))}
        </div>

        <details className="mt-12 rounded-2xl border border-border bg-surface" open>
          <summary className="cursor-pointer p-6 font-display text-lg font-bold uppercase">
            Comparativa completa de planes
          </summary>
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-6 py-3">Característica</th>
                  {plans.map((p) => (
                    <th key={p.name} className="px-6 py-3 text-center">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r) => (
                  <tr key={r.l} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 font-medium">{r.l}</td>
                    {r.v.map((cell, i) => (
                      <td key={i} className="px-6 py-3 text-center">
                        {typeof cell === "boolean" ? (
                          cell ? (
                            <Check className="mx-auto h-4 w-4 text-primary" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                          )
                        ) : (
                          <span className="font-semibold">{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
