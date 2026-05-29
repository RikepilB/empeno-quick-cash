import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo, LogoText } from "@/ui/Logo";

export const Route = createFileRoute("/faq")({
  component: Faq,
});

function Faq() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={36} className="rounded-lg" />
          <LogoText />
        </Link>
        <Link
          to="/"
          aria-label="Volver al inicio"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl">
          Preguntas Frecuentes
        </h1>
        <p className="mt-3 text-muted-foreground">Todo lo que necesitas saber sobre EMPEÑALO.</p>

        <div className="mt-10 space-y-10">
          <div>
            <h2 className="font-display text-xl font-bold uppercase">Para clientes</h2>
            <div className="mt-4 space-y-6">
              <FaqItem
                q="¿Cómo publico un artículo?"
                a={
                  <>
                    Crea una cuenta gratuita, inicia sesión y haz clic en "Publicar artículo".
                    Completa el formulario con fotos, categoría, estado y el plazo que necesitas. En
                    menos de 2 minutos tu solicitud estará visible para todas las casas de empeño
                    verificadas.
                  </>
                }
              />
              <FaqItem
                q="¿Cuánto cuesta publicar?"
                a="Publicar es completamente gratis. EMPEÑALO no cobra comisiones al cliente. Las casas de empeño pagan una suscripción mensual para acceder a la plataforma."
              />
              <FaqItem
                q="¿Cómo funcionan las ofertas?"
                a="Una vez que publicas, las casas de empeño revisan tu artículo y te envían propuestas con monto, tasa de interés y plazo. Tú comparas todas las ofertas y eliges la que más te convenga."
              />
              <FaqItem
                q="¿Cómo acepto una oferta?"
                a="Revisa tus propuestas en el panel. Cuando encuentres una que te guste, haz clic en 'Aceptar'. Recibirás un código único de 6 dígitos que debes presentar en el local de la casa de empeño para concretar el trato."
              />
              <FaqItem
                q="¿Qué es el código de redención?"
                a="Es un código único de 6 dígitos que se genera cuando aceptas una propuesta. La casa de empeño lo valida en su panel para confirmar que la operación se concretó. Sin el código, la casa de empeño no puede cerrar la operación en el sistema."
              />
              <FaqItem
                q="¿Mis datos están seguros?"
                a="Sí. Cumplimos con la Ley de Protección de Datos Personales del Perú (Ley N° 29733). Tus datos están cifrados. Las casas de empeño solo ven la información necesaria para hacer una oferta (descripción del artículo y fotos). No ven tu DNI ni dirección."
              />
              <FaqItem
                q="¿Puedo tener múltiples solicitudes activas?"
                a="Sí. Puedes publicar varios artículos al mismo tiempo. Cada uno tendrá su propio conjunto de propuestas y podrás gestionarlos desde tu panel."
              />
              <FaqItem
                q="¿Qué pasa si no acepto ninguna oferta?"
                a="No hay problema. Puedes dejar tu solicitud abierta para seguir recibiendo propuestas, o cerrarla si ya no la necesitas. No hay penalización."
              />
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold uppercase">Para casas de empeño</h2>
            <div className="mt-4 space-y-6">
              <FaqItem
                q="¿Cómo me registro como casa de empeño?"
                a="Crea una cuenta en el portal de negocios (/negocio). Completa el formulario con tu RUC, razón social y datos de contacto. Nuestro equipo verificará tu información en un plazo de 24 a 48 horas hábiles."
              />
              <FaqItem
                q="¿Cuánto cuesta usar EMPEÑALO?"
                a={
                  <>
                    Ofrecemos tres planes: Básico (S/ 10/mes, hasta 5 ofertas), Intermedio (S/
                    20/mes, hasta 30 ofertas) y Avanzado (S/ 30/mes, ofertas ilimitadas). Todos los
                    planes incluyen acceso al marketplace y soporte.
                  </>
                }
              />
              <FaqItem
                q="¿Cómo envío una propuesta?"
                a="Explora el marketplace de solicitudes. Cuando encuentres un artículo que te interese, haz clic en 'Enviar propuesta', ingresa el monto, la tasa mensual y el plazo. El cliente recibirá tu propuesta junto con las de otras casas de empeño."
              />
              <FaqItem
                q="¿Cómo sé si un cliente aceptó mi propuesta?"
                a="Recibirás una notificación en tu panel y por correo. La propuesta cambiará a estado 'Aceptada' y podrás ver el código de redención cuando el cliente lo presente en tu local."
              />
              <FaqItem
                q="¿Qué hago cuando el cliente llega al local con el código?"
                a="Ingresa el código de 6 dígitos en tu panel, en la sección 'Validar código'. Si el código coincide, la operación se marca como completada y se registra en el sistema."
              />
              <FaqItem
                q="¿Puedo cambiar de plan?"
                a="Sí. Puedes subir o bajar de plan en cualquier momento desde la sección de facturación de tu panel. El cambio se aplica al siguiente ciclo de facturación."
              />
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-bold uppercase">General</h2>
            <div className="mt-4 space-y-6">
              <FaqItem
                q="¿En qué ciudades opera EMPEÑALO?"
                a="Actualmente operamos en Lima Metropolitana. Estamos trabajando para expandirnos a otras ciudades del Perú pronto."
              />
              <FaqItem
                q="¿Cómo contacto a soporte?"
                a={
                  <>
                    Escríbenos a <span className="text-foreground">hola@empenalo.pe</span>.
                    Respondemos en un plazo máximo de 24 horas hábiles.
                  </>
                }
              />
              <FaqItem
                q="¿EMPEÑALO es una casa de empeño?"
                a="No. EMPEÑALO es una plataforma que conecta a clientes con casas de empeño verificadas. No realizamos operaciones de empeño directamente. Somos un marketplace."
              />
            </div>
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

function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold">{q}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{a}</p>
    </div>
  );
}
