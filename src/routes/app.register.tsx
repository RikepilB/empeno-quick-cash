import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Check, Upload, Smartphone } from "lucide-react";

export const Route = createFileRoute("/app/register")({ component: Register });

function Register() {
  return (
    <PhoneFrame title="Crear cuenta" back="/app">
      <div className="space-y-5 p-6">
        <div>
          <label className="label-field">Nombre completo</label>
          <input className="input-field" defaultValue="María Fernández Castro" />
        </div>
        <div>
          <label className="label-field">Correo electrónico</label>
          <input className="input-field" defaultValue="maria.f@correo.com" />
        </div>
        <div>
          <label className="label-field">Contraseña</label>
          <input type="password" className="input-field" defaultValue="••••••••••" />
        </div>

        <div>
          <label className="label-field">Celular</label>
          <div className="flex gap-2">
            <input className="input-field flex-1" defaultValue="+51 987 654 321" />
            <button className="rounded-xl border border-primary bg-primary/10 px-3 text-xs font-semibold text-primary">Enviar</button>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-status-accepted/15 px-3 py-2 text-xs text-status-accepted">
            <Check className="h-3.5 w-3.5" /> Código enviado · ingresa los 6 dígitos
          </div>
          <div className="mt-2 flex gap-2">
            {[4, 7, 2, 1, 9, 5].map((d, i) => (
              <input key={i} className="input-field h-12 w-full text-center font-display text-xl" defaultValue={d} />
            ))}
          </div>
        </div>

        <div>
          <label className="label-field">Verificación de identidad (DNI)</label>
          <div className="rounded-xl border-2 border-dashed border-border bg-surface p-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="mt-2 text-sm font-semibold">Toma una foto de tu DNI</div>
            <div className="text-xs text-muted-foreground">Frontal · Reverso</div>
            <div className="mt-3 flex justify-center gap-2">
              <span className="badge-dot badge-accepted"><Check className="h-3 w-3" /> Frontal</span>
              <span className="badge-dot badge-accepted"><Check className="h-3 w-3" /> Reverso</span>
            </div>
          </div>
        </div>

        <Link to="/app/dashboard" className="btn-primary w-full">
          <Smartphone className="h-4 w-4" /> Completar registro
        </Link>
      </div>
    </PhoneFrame>
  );
}
