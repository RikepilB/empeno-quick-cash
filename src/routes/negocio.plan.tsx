import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/negocio/plan")({ component: PlanPage });

function PlanPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-4 rounded-2xl border border-primary/40 bg-primary/5 p-8 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-primary" />
        <h2 className="font-display text-2xl font-bold uppercase">Beta — Acceso completo</h2>
        <p className="text-sm text-muted-foreground">
          Durante la fase beta, todas las casas de empeño tienen acceso ilimitado a la plataforma.
          Los planes y precios se anunciarán cuando lancemos oficialmente.
        </p>
        <div className="flex flex-col gap-2">
          <div className="rounded-lg bg-background p-3 text-left text-sm">
            <span className="font-semibold">Que incluye la beta:</span>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>Ofertas ilimitadas</li>
              <li>Acceso al marketplace completo</li>
              <li>Herramientas de gestión</li>
              <li>Soporte prioritario</li>
            </ul>
          </div>
          <Link to="/negocio/perfil" className="btn-primary text-sm">
            Ir a mi cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
