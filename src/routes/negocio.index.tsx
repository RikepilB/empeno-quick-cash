import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Upload, Clock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/negocio/")({ component: NegocioLanding });

function NegocioLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">E</div>
          <span className="font-display text-lg font-bold tracking-widest">EMPEÑALO</span>
          <span className="ml-1 rounded-md border border-border bg-surface px-2 py-0.5 text-[10px] uppercase text-muted-foreground">B2B</span>
        </Link>
        <Link to="/negocio/dashboard" className="text-sm text-primary hover:underline">Ya tengo cuenta</Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-2 lg:items-start">
        <div>
          <span className="badge-dot badge-new"><Building2 className="h-3 w-3" /> Para casas de empeño</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-tight md:text-5xl">
            Recibe solicitudes y haz <span className="text-primary">más ofertas</span> sin que el cliente venga primero al local.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Conecta tu negocio a una red de clientes calificados. Tú defines monto, tasa y plazo. EMPEÑALO se encarga del resto.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { t: "Sin tasaciones de la plataforma", d: "Tú defines la propuesta basada en lo que ves." },
              { t: "Solo clientes verificados con DNI", d: "Cero pérdidas de tiempo." },
              { t: "Reportes y herramientas de gestión", d: "Lleva el control de cada operación." },
            ].map((x) => (
              <div key={x.t} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <div className="text-sm font-semibold">{x.t}</div>
                  <div className="text-xs text-muted-foreground">{x.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-8">
          <h2 className="font-display text-xl font-bold uppercase">Registra tu negocio</h2>
          <p className="text-xs text-muted-foreground">Verificamos en máximo 48 horas.</p>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Nombre comercial</label>
                <input className="input-field" defaultValue="Joyería Miraflores" />
              </div>
              <div>
                <label className="label-field">RUC</label>
                <input className="input-field" defaultValue="20512345678" />
              </div>
            </div>
            <div>
              <label className="label-field">Representante legal</label>
              <input className="input-field" defaultValue="Carlos Méndez" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Correo</label>
                <input className="input-field" defaultValue="contacto@joymira.pe" />
              </div>
              <div>
                <label className="label-field">Contraseña</label>
                <input type="password" className="input-field" defaultValue="••••••••" />
              </div>
            </div>
            <div>
              <label className="label-field">Dirección y distrito</label>
              <input className="input-field" defaultValue="Av. Larco 345, Of. 201 — Miraflores" />
            </div>
            <div>
              <label className="label-field">Horarios de atención</label>
              <input className="input-field" defaultValue="Lun a Sáb · 9:00 – 19:00" />
            </div>
            <div>
              <label className="label-field">Documentos legales</label>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-border bg-background p-4 text-xs text-muted-foreground hover:border-primary">
                  <Upload className="h-4 w-4" /> Licencia funcionamiento
                </button>
                <button className="flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-border bg-background p-4 text-xs text-muted-foreground hover:border-primary">
                  <Upload className="h-4 w-4" /> Ficha RUC
                </button>
              </div>
            </div>
          </div>

          <Link to="/negocio/plan" className="btn-primary mt-6 w-full">
            Enviar solicitud <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-status-pending/10 p-3 text-xs text-status-pending">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Tu solicitud entrará a revisión. Te avisaremos en máximo 48 horas.
          </div>
        </div>
      </div>
    </div>
  );
}
