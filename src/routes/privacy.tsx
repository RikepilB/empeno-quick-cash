import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo, LogoText } from "@/ui/Logo";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
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
        <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl">
          Política de Privacidad
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Última actualización: Mayo 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed">
          <Section
            title="1. Información que recopilamos"
            content={
              <>
                <p>Para operar EMPEÑALO recopilamos la siguiente información:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Correo electrónico y contraseña (autenticación)</li>
                  <li>Nombre, apellido y DNI (verificación de identidad para clientes)</li>
                  <li>RUC, razón social y dirección fiscal (verificación de casas de empeño)</li>
                  <li>Fotos y descripciones de artículos publicados</li>
                  <li>Datos de navegación (cookies necesarias para el funcionamiento)</li>
                </ul>
              </>
            }
          />

          <Section
            title="2. Finalidad del tratamiento"
            content={
              <>
                <p>Usamos tus datos exclusivamente para:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Crear y gestionar tu cuenta</li>
                  <li>Publicar tus solicitudes de empeño y conectarte con casas de empeño</li>
                  <li>Verificar la identidad de clientes y la autenticidad de negocios</li>
                  <li>
                    Enviar notificaciones sobre ofertas, propuestas y estados de tus solicitudes
                  </li>
                  <li>Mejorar la plataforma y prevenir fraudes</li>
                </ul>
              </>
            }
          />

          <Section
            title="3. Ley N° 29733 — Protección de Datos Personales"
            content={
              <p>
                EMPEÑALO cumple con la Ley de Protección de Datos Personales del Perú (Ley N° 29733)
                y su reglamento. Tus datos personales son almacenados en servidores seguros con
                cifrado. No compartimos tus datos con terceros sin tu consentimiento expreso, salvo
                cuando sea requerido por ley.
              </p>
            }
          />

          <Section
            title="4. Cookies"
            content={
              <p>
                Utilizamos cookies esenciales para mantener tu sesión activa y recordar tus
                preferencias. No usamos cookies de rastreo publicitario. Puedes configurar tu
                navegador para rechazar cookies, pero algunas funciones de la plataforma podrían no
                estar disponibles.
              </p>
            }
          />

          <Section
            title="5. Compartir información"
            content={
              <>
                <p>Compartimos tu información únicamente en los siguientes casos:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>
                    <strong>Con casas de empeño:</strong> cuando publicas un artículo, las casas de
                    empeño ven la descripción, fotos y categoría (no ven tu DNI ni datos completos).
                  </li>
                  <li>
                    <strong>Con clientes:</strong> cuando una casa de empeño envía una propuesta, el
                    cliente ve el nombre comercial, monto, tasa y plazo.
                  </li>
                  <li>
                    <strong>Proveedores de infraestructura:</strong> Supabase (base de datos y
                    autenticación) y Netlify (hospedaje). Ambos cumplen con estándares de seguridad
                    internacionales.
                  </li>
                </ul>
              </>
            }
          />

          <Section
            title="6. Derechos del titular"
            content={
              <>
                <p>De acuerdo con la Ley N° 29733, tienes derecho a:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>Acceder a tus datos personales</li>
                  <li>Rectificar datos inexactos o incompletos</li>
                  <li>Cancelar tus datos cuando ya no sean necesarios</li>
                  <li>Oponerte al tratamiento de tus datos para fines específicos</li>
                </ul>
                <p className="mt-2">
                  Para ejercer estos derechos, escríbenos al banco de datos personal:{" "}
                  <span className="text-foreground">privacidad@empenalo.pe</span>
                </p>
              </>
            }
          />

          <Section
            title="7. Seguridad"
            content={
              <p>
                Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado en
                tránsito (HTTPS/TLS), cifrado en reposo, autenticación de dos factores para
                administradores, y monitoreo continuo de accesos. En caso de una brecha de seguridad
                que afecte tus datos, te notificaremos en un plazo máximo de 48 horas.
              </p>
            }
          />

          <Section
            title="8. Cambios a esta política"
            content={
              <p>
                Cualquier cambio a esta política será publicado en esta página y, si es
                significativo, te notificaremos por correo electrónico. Te recomendamos revisar esta
                página periódicamente.
              </p>
            }
          />

          <Section
            title="9. Contacto"
            content={
              <p>
                Para cualquier consulta sobre esta política o sobre el tratamiento de tus datos,
                escríbenos a <span className="text-foreground">privacidad@empenalo.pe</span> o a
                través del formulario de contacto en nuestra página principal.
              </p>
            }
          />
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 EMPEÑALO · Lima, Perú
      </footer>
    </div>
  );
}

function Section({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold uppercase">{title}</h2>
      <div className="mt-2 text-muted-foreground">{content}</div>
    </div>
  );
}
