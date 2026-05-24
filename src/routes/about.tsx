import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Shield, Zap, ArrowLeft } from "lucide-react";
import { Logo, LogoText } from "@/ui/Logo";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={36} className="rounded-lg" />
          <LogoText />
        </Link>
        <Link
          to="/"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <span className="badge-dot badge-accepted">
          <Sparkles className="h-3 w-3" /> Fintech 100% peruana
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl">
          Sobre EMPEÑALO
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          EMPEÑALO es la primera plataforma digital peruana que conecta a personas que necesitan
          empeñar un artículo con múltiples casas de empeño verificadas, todo en un solo lugar.
        </p>

        <div className="mt-12 space-y-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Nuestra misión</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Democratizar el acceso al crédito prendario en el Perú. Eliminamos la fricción de
              visitar casa por casa, permitiendo que recibas ofertas reales de múltiples
              establecimientos desde tu celular. Tú comparas y decides cuál te conviene.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Cómo funciona</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                {
                  n: "01",
                  t: "Publica tu artículo",
                  d: "Sube fotos, describe el estado y el plazo que necesitas. Toma menos de 2 minutos.",
                },
                {
                  n: "02",
                  t: "Recibe ofertas",
                  d: "Casas de empeño verificadas te envían propuestas con monto, tasa y plazo.",
                },
                {
                  n: "03",
                  t: "Elige y cobra",
                  d: "Aceptas la mejor oferta, recibes un código único y vas al local a concretar.",
                },
              ].map((s) => (
                <div key={s.n} className="card-surface">
                  <div className="font-display text-4xl font-bold text-primary">{s.n}</div>
                  <div className="mt-2 font-display text-lg font-bold uppercase">{s.t}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Nuestros valores</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ValueCard
                icon={Shield}
                t="Verificación real"
                d="Cada casa de empeño pasa por un proceso de verificación antes de poder enviar ofertas."
              />
              <ValueCard
                icon={Zap}
                t="Sin intermediarios"
                d="Las propuestas llegan directo de la casa de empeño a ti. Sin comisiones ocultas."
              />
              <ValueCard
                icon={Sparkles}
                t="Tú decides"
                d="Compara libremente todas las ofertas. Sin presión. Sin letra chica."
              />
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Presencia</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Actualmente operamos en Lima Metropolitana con planes de expansión a las principales
              ciudades del Perú. Si tienes una casa de empeño fuera de Lima y quieres unirte,
              escríbenos.
            </p>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Contacto</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              ¿Preguntas, sugerencias o prensa? Escríbenos a{" "}
              <span className="text-foreground">hola@empenalo.pe</span>
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-3">
          <Link to="/app" className="btn-primary text-base">
            Soy cliente
          </Link>
          <Link to="/negocio" className="btn-ghost text-base">
            Soy casa de empeño
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 EMPEÑALO · Lima, Perú
      </footer>
    </div>
  );
}

function ValueCard({ icon: Icon, t, d }: { icon: typeof Shield; t: string; d: string }) {
  return (
    <div className="card-surface flex flex-col items-start gap-3">
      <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="font-display text-lg font-bold uppercase">{t}</div>
        <p className="mt-1 text-sm text-muted-foreground">{d}</p>
      </div>
    </div>
  );
}
