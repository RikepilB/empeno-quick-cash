import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { TrendingUp, Send, CheckCircle2, Inbox, AlertTriangle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/negocio/dashboard")({ component: BizDashboard });

const nuevas = [
  { id: "S-4231", art: "iPhone 14 Pro 256GB", cat: "Celular", monto: 2500, plazo: 30, distrito: "Surquillo", time: "hace 5 min", propuestas: 0 },
  { id: "S-4230", art: "Reloj Tissot PRX", cat: "Reloj", monto: 1800, plazo: 30, distrito: "San Borja", time: "hace 22 min", propuestas: 2 },
  { id: "S-4228", art: "Anillo oro 18k 8.4g", cat: "Joya", monto: 1200, plazo: 45, distrito: "Miraflores", time: "hace 1 h", propuestas: 4 },
  { id: "S-4225", art: "MacBook Pro M2 14\"", cat: "Laptop", monto: 5500, plazo: 60, distrito: "San Isidro", time: "hace 2 h", propuestas: 1 },
];

const pendientes = [
  { art: "PlayStation 5", monto: 1400, time: "Vence en 2h" },
  { art: "Cadena oro 14k", monto: 900, time: "Vence en 5h" },
  { art: "Samsung S23 Ultra", monto: 2100, time: "Vence en 8h" },
];

function BizDashboard() {
  return (
    <BusinessLayout title="Buen día, Joyería Miraflores" subtitle="Aquí está tu actividad de hoy · jueves 15 mayo 2026">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Inbox} label="Solicitudes disponibles" value="48" delta="+12 hoy" tone="primary" />
        <Metric icon={Send} label="Propuestas enviadas" value="8/30" delta="22 restantes" />
        <Metric icon={CheckCircle2} label="Aceptadas este mes" value="3" delta="+1 ayer" />
        <Metric icon={TrendingUp} label="Tasa conversión" value="37.5%" delta="+5% vs abril" />
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-status-pending/30 bg-status-pending/10 p-4 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0 text-status-pending" />
        <div>
          <span className="font-semibold text-status-pending">Te quedan 22 propuestas</span>
          <span className="text-muted-foreground"> este mes. Considera el plan Avanzado para ofertas ilimitadas.</span>
        </div>
        <Link to="/negocio/perfil" className="ml-auto text-xs font-semibold text-primary hover:underline">Mejorar plan →</Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold uppercase">Solicitudes nuevas</h2>
            <Link to="/negocio/solicitudes" className="text-xs font-semibold text-primary hover:underline">Ver todas →</Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                  <th className="px-4 py-3">Artículo</th>
                  <th className="px-4 py-3">Monto ref.</th>
                  <th className="px-4 py-3">Plazo</th>
                  <th className="px-4 py-3">Distrito</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {nuevas.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="badge-dot badge-new">Nueva</span>
                        <div>
                          <div className="font-semibold">{s.art}</div>
                          <div className="text-[11px] text-muted-foreground">{s.id} · {s.time}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-display font-bold">S/ {s.monto.toLocaleString()}</td>
                    <td className="px-4 py-3">{s.plazo} días</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.distrito}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/negocio/solicitud" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        Detalle <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside>
          <h2 className="mb-3 font-display text-xl font-bold uppercase">Propuestas en curso</h2>
          <div className="space-y-2 rounded-2xl border border-border bg-surface p-3">
            {pendientes.map((p) => (
              <Link key={p.art} to="/negocio/propuestas" className="block rounded-lg border border-border bg-background p-3 hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <span className="badge-dot badge-pending">Pendiente</span>
                  <span className="text-[11px] text-muted-foreground">{p.time}</span>
                </div>
                <div className="mt-2 text-sm font-semibold">{p.art}</div>
                <div className="text-xs text-muted-foreground">S/ {p.monto}</div>
              </Link>
            ))}
            <Link to="/negocio/propuestas" className="block rounded-lg py-2 text-center text-xs text-primary hover:underline">
              Ver todas mis propuestas
            </Link>
          </div>
        </aside>
      </div>
    </BusinessLayout>
  );
}

function Metric({ icon: Icon, label, value, delta, tone }: { icon: typeof Inbox; label: string; value: string; delta: string; tone?: "primary" }) {
  return (
    <div className={`rounded-2xl border p-5 ${tone === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-surface"}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{delta}</div>
    </div>
  );
}
