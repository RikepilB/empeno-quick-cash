import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessLayout } from "@/ui/BusinessLayout";
import { Loader2, ReceiptText, ShieldCheck, Sparkles, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBusinessContext } from "@/services/business";
import { listMyInvoices, getBillingMode } from "@/services/billing";
import { formatPEN } from "@/lib/categories";
import { getCulqiPublicKey } from "@/lib/payments/checkout";

export const Route = createFileRoute("/negocio/perfil")({ component: Perfil });

function Perfil() {
  const qc = useQueryClient();
  const context = useQuery({ queryKey: ["businessContext"], queryFn: () => getBusinessContext() });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: () => listMyInvoices() });
  const billingMode = useQuery({ queryKey: ["billingMode"], queryFn: () => getBillingMode() });

  const [msg, setMsg] = useState<string | null>(null);

  const sub = context.data?.subscription;
  const business = context.data?.business;

  if (context.isLoading) {
    return (
      <BusinessLayout title="Cuenta" subtitle="Configuración y facturación">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </BusinessLayout>
    );
  }

  const isDemo = billingMode.data?.mode === "demo";
  const missingPublicKey = !isDemo && !getCulqiPublicKey();

  return (
    <BusinessLayout title="Cuenta" subtitle="Configuración y facturación">
      {!business?.verified_at && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-status-pending/30 bg-status-pending/10 p-4 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-status-pending" />
          <div>
            <span className="font-semibold text-status-pending">
              Negocio pendiente de verificación.
            </span>
            <span className="text-muted-foreground">
              {" "}
              Completa el proceso para acceder a planes y facturación.
            </span>
          </div>
        </div>
      )}

      {msg && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1">{msg}</div>
          <button
            onClick={() => setMsg(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            cerrar
          </button>
        </div>
      )}

      {isDemo && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-status-pending/30 bg-status-pending/10 p-4 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-status-pending" />
          <div>
            <div className="font-semibold text-status-pending">Modo demo de facturación</div>
            <div className="text-muted-foreground">
              Aún no se ha configurado <code>CULQI_SECRET_KEY</code>. Los cambios de plan se aplican
              al instante sin cobrar. Cuando agregues la clave, las suscripciones pasarán por Culqi
              automáticamente.
            </div>
          </div>
        </div>
      )}

      {missingPublicKey && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-destructive" />
          <div>
            <div className="font-semibold text-destructive">Falta clave pública de Culqi</div>
            <div className="text-muted-foreground">
              El servidor está en modo live pero <code>VITE_CULQI_PUBLIC_KEY</code> no está
              configurada en el cliente. No se puede cobrar hasta que se agregue.
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Business identity */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-3">
          <h3 className="font-display text-xl font-bold uppercase">Datos del negocio</h3>
          <div className="mt-3 text-sm">
            {business?.name ?? "—"} · {business?.district ?? "Sin distrito"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {business?.verified_at ? (
              <span className="text-status-accepted">Verificado</span>
            ) : (
              <span className="text-status-pending">Pendiente de verificación</span>
            )}
          </div>
        </div>

        {business?.verified_at ? (
          <>
            {/* Beta badge */}
            <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Fase beta</div>
                  <div className="mt-1 font-display text-2xl font-bold text-primary">
                    Acceso completo
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Durante la beta, todas las funcionalidades están disponibles sin límites. Los
                    planes y precios se comunicarán cuando lancemos oficialmente.
                  </div>
                </div>
                <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                  Ofertas ilimitadas
                </div>
              </div>
            </div>

            {/* Invoices */}
            <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold uppercase">Historial de facturas</h3>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ReceiptText className="h-3.5 w-3.5" />
                  {(invoices.data ?? []).length} facturas
                </span>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                {invoices.isLoading ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...
                  </div>
                ) : (invoices.data ?? []).length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Sin facturas aún.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-background text-left text-[11px] uppercase text-muted-foreground">
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Monto</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Periodo</th>
                        <th className="px-4 py-3">Charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoices.data ?? []).map((inv) => (
                        <tr key={inv.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(inv.created_at).toLocaleDateString("es-PE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 font-semibold uppercase">
                            {inv.plan_id ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-display font-bold">
                            {formatPEN(inv.amount_pen)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge-dot ${invStatusBadge(inv.status)}`}>
                              {invStatusLabel(inv.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {inv.period_start && inv.period_end
                              ? `${new Date(inv.period_start).toLocaleDateString("es-PE", { day: "numeric", month: "short" })} – ${new Date(inv.period_end).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">
                            {inv.culqi_charge_id ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
            <div className="text-center text-sm text-muted-foreground py-8">
              <p className="font-semibold">Planes y facturación no disponibles</p>
              <p className="mt-1">Completa la verificación de tu negocio para acceder.</p>
              <Link
                to="/negocio/plan"
                className="mt-3 inline-block text-xs text-primary hover:underline"
              >
                Ver planes disponibles →
              </Link>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
}

function invStatusBadge(s: string): string {
  if (s === "paid") return "badge-accepted";
  if (s === "demo") return "badge-new";
  if (s === "failed" || s === "refunded") return "badge-reported";
  return "badge-pending";
}

function invStatusLabel(s: string): string {
  if (s === "paid") return "Pagada";
  if (s === "demo") return "Demo";
  if (s === "failed") return "Fallida";
  if (s === "refunded") return "Reembolsada";
  if (s === "pending") return "Pendiente";
  return s;
}
