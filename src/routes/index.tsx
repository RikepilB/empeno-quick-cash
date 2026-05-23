import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Smartphone, Building2, Sparkles, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-xl font-bold text-primary-foreground">
            E
          </div>
          <span className="font-display text-xl font-bold tracking-widest">EMPEÑALO</span>
        </div>
        <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#como-funciona" className="hover:text-foreground">
            Cómo funciona
          </a>
          <Link to="/app" className="btn-ghost py-2 text-sm">
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-12 md:pt-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="badge-dot badge-accepted">
              <Sparkles className="h-3 w-3" /> Fintech 100% peruana
            </span>
            <h1 className="mt-5 font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
              Empeña tu artículo y recibe{" "}
              <span className="text-primary">múltiples ofertas reales</span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Publica una vez. Múltiples casas de empeño te envían su mejor propuesta. Tú eliges la
              mejor y obtienes un código único para concretar el trato presencialmente.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app" className="btn-primary text-base">
                <Smartphone className="h-4 w-4" /> Soy cliente
              </Link>
              <Link to="/negocio" className="btn-ghost text-base">
                <Building2 className="h-4 w-4" /> Soy casa de empeño
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6">
              <Stat n="Lima" l="Disponible ahora" />
              <Stat n="11" l="Categorías" />
              <Stat n="100%" l="Verificado" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-primary/10 blur-3xl" />
            <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-2xl">
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>Solicitud #4231</span>
                <span className="badge-dot badge-new">3 propuestas</span>
              </div>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 font-display text-2xl">
                  📱
                </div>
                <div>
                  <div className="font-display text-xl font-bold">iPhone 14 Pro 256GB</div>
                  <div className="text-sm text-muted-foreground">Estado: Bueno · 30 días</div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { name: "Joyería Miraflores", monto: "S/ 2,400", tasa: "4.5%", best: true },
                  { name: "Empeños Lima Centro", monto: "S/ 2,200", tasa: "5.0%" },
                  { name: "Casa Oro Surco", monto: "S/ 2,100", tasa: "4.0%" },
                ].map((p) => (
                  <div
                    key={p.name}
                    className={`rounded-xl border p-3 ${p.best ? "border-primary bg-primary/5" : "border-border bg-background"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{p.name}</span>
                      {p.best && <span className="badge-dot badge-accepted">Mejor oferta</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Monto:{" "}
                        <span className="font-display text-base text-foreground">{p.monto}</span>
                      </span>
                      <span>
                        Tasa: <span className="text-foreground">{p.tasa}/mes</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="font-display text-3xl font-bold uppercase md:text-4xl">Así de simple</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Publicar",
                d: "Sube fotos y datos del artículo. Toma menos de 2 minutos.",
              },
              {
                n: "02",
                t: "Recibir ofertas",
                d: "Las casas de empeño te envían propuestas con monto, tasa y plazo.",
              },
              {
                n: "03",
                t: "Elegir y cobrar",
                d: "Aceptas la mejor, recibes un código único y vas al local.",
              },
            ].map((s) => (
              <div key={s.n} className="card-surface">
                <div className="font-display text-5xl font-bold text-primary">{s.n}</div>
                <div className="mt-3 font-display text-xl font-bold uppercase">{s.t}</div>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-6 py-16">
        <div>
          <h2 className="font-display text-3xl font-bold uppercase md:text-4xl">
            ¿Tienes una casa de empeño?
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Recibe solicitudes calificadas y haz ofertas sin esperar a que el cliente venga al
            local.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <>
            <div className="mt-8 flex gap-4 md:justify-end">
              <Link to="/negocio" className="btn-primary">
                Ver panel <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <PlanCard
                name="Básico"
                price="10"
                features={["Hasta 5 ofertas/mes", "Acceso al marketplace", "Soporte por correo"]}
              />
              <PlanCard
                name="Intermedio"
                price="20"
                popular
                features={[
                  "Hasta 30 ofertas/mes",
                  "Herramientas de gestión",
                  "Reportes mensuales",
                  "Soporte prioritario",
                ]}
              />
              <PlanCard
                name="Avanzado"
                price="30"
                features={[
                  "Ofertas ilimitadas",
                  "Prioridad en solicitudes",
                  "Alertas por categoría",
                  "Múltiples usuarios",
                ]}
              />
            </div>
          </>
        )}
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-3">
          <Trust
            icon={Shield}
            t="100% verificado"
            d="Verificación de identidad y validación de negocios."
          />
          <Trust
            icon={Zap}
            t="Múltiples ofertas"
            d="Sin tasaciones intermedias. Las propuestas llegan directo."
          />
          <Trust icon={Sparkles} t="Tú decides" d="Compara y elige libremente. Sin presión." />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 EMPEÑALO · Lima, Perú
      </footer>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold text-primary">{n}</div>
      <div className="text-xs text-muted-foreground">{l}</div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  features,
  popular,
}: {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 ${popular ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
    >
      {popular && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase text-primary-foreground">
          Más popular
        </span>
      )}
      <div className="font-display text-2xl font-bold uppercase">{name}</div>
      <div className="mt-3 flex items-end gap-1">
        <span className="font-display text-5xl font-extrabold">S/ {price}</span>
        <span className="pb-2 text-sm text-muted-foreground">/mes</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> {f}
          </li>
        ))}
      </ul>
      <Link
        to="/negocio"
        className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-semibold ${popular ? "bg-primary text-primary-foreground" : "border border-border bg-surface hover:bg-surface-2"}`}
      >
        Empezar
      </Link>
    </div>
  );
}

function Trust({ icon: Icon, t, d }: { icon: typeof Shield; t: string; d: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-lg font-bold uppercase">{t}</div>
        <p className="text-sm text-muted-foreground">{d}</p>
      </div>
    </div>
  );
}
