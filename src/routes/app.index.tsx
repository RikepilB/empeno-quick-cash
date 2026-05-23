import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/services/auth";
import { Logo, LogoText } from "@/ui/Logo";

export const Route = createFileRoute("/app/")({
  component: AppLanding,
});

async function AppLanding() {
  const session = await getCurrentUser();
  if (session?.profile.role === "client") {
    throw redirect({ to: "/app/dashboard" });
  }

  return (
    <PhoneFrame hideHeader>
      <div className="flex min-h-[680px] flex-col bg-gradient-to-b from-surface to-background p-6">
        <div className="flex items-center gap-2">
          <Logo size={36} className="rounded-lg" />
          <LogoText />
        </div>

        <div className="mt-12 flex-1">
          <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95]">
            Empeña tu artículo y recibe ofertas de{" "}
            <span className="text-primary">múltiples casas de empeño</span> en minutos.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Sin tasaciones intermedias. Tú comparas, tú decides.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { n: "1", t: "Publicar", d: "Sube fotos y datos del artículo." },
              {
                n: "2",
                t: "Recibir ofertas",
                d: "Las casas de empeño te proponen monto, tasa y plazo.",
              },
              { n: "3", t: "Elegir y cobrar", d: "Acepta una y recibe tu código único." },
            ].map((s) => (
              <div
                key={s.n}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-display text-lg font-bold text-primary">
                  {s.n}
                </div>
                <div>
                  <div className="font-display text-base font-bold uppercase">{s.t}</div>
                  <div className="text-xs text-muted-foreground">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 pt-8">
          <Link to="/app/dashboard" className="btn-primary w-full">
            Iniciar sesión <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/app/register" className="btn-ghost w-full">
            Crear cuenta nueva
          </Link>
          <p className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> Verificación con DNI · 100% seguro
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}
