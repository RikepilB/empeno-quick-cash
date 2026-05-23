import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { registerClient } from "@/services/auth";
import { Logo } from "@/ui/Logo";
import { CookieBanner } from "@/ui/CookieBanner";

export const Route = createFileRoute("/app/register")({ component: Register });

function Register() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  function handleDniBlur(dni: string) {
    if (/^\d{8}$/.test(dni)) {
      const mockNames = [
        "María Fernanda López",
        "José Carlos Mendoza",
        "Ana Patricia Quispe",
        "Carlos Enrique Rodríguez",
        "Lucía del Pilar Torres",
      ];
      const nameInput = document.querySelector<HTMLInputElement>('input[name="full_name"]');
      if (nameInput) nameInput.value = mockNames[Math.floor(Math.random() * mockNames.length)];
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const dni = String(form.get("dni") ?? "").trim();
      const full_name = String(form.get("full_name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");
      const phone = String(form.get("phone") ?? "").trim();

      const { sessionCreated } = await registerClient({
        data: {
          email,
          password,
          full_name,
          dni: dni || undefined,
          phone: phone || undefined,
          email_verified: emailVerified,
        },
      });
      if (sessionCreated) {
        await navigate({ to: "/app/dashboard" });
      } else {
        await navigate({ to: "/app/login", search: { confirm: 1 } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
        <aside className="hidden items-center justify-center border-r border-border bg-surface lg:flex">
          <div className="text-center">
            <div className="mx-auto rounded-2xl shadow-glow">
              <Logo size={80} className="rounded-2xl" />
            </div>
            <div className="mt-6 font-display text-3xl font-bold uppercase tracking-widest">
              EMPEÑALO
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Publica una vez. Múltiples casas de empeño compiten por ofrecerte la mejor propuesta.
            </p>
          </div>
        </aside>

        <main className="flex flex-col">
          <header className="flex items-center justify-between px-4 py-4 md:px-8">
            <Link
              to="/"
              aria-label="Volver al inicio"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <Logo size={28} className="rounded-lg" />
              <span className="font-display text-sm font-bold tracking-widest">EMPEÑALO</span>
            </div>
            <div className="w-10" aria-hidden />
          </header>

          <div className="flex flex-1 items-center justify-center px-4 pb-10 md:px-8">
            <div className="w-full max-w-[420px]">
              <div className="mb-8 lg:hidden text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary font-display text-3xl font-bold text-primary-foreground">
                  E
                </div>
                <h2 className="mt-3 font-display text-xl font-bold uppercase tracking-widest">
                  EMPEÑALO
                </h2>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
                <h1 className="font-display text-2xl font-bold">Crear cuenta</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Publica solicitudes y recibe propuestas de casas de empeño verificadas.
                </p>

                <form onSubmit={onSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">DNI</label>
                    <input
                      name="dni"
                      required
                      pattern="\d{8}"
                      maxLength={8}
                      inputMode="numeric"
                      className="input-field"
                      placeholder="87654321"
                      autoComplete="off"
                      onBlur={(e) => handleDniBlur(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Nombre completo</label>
                    <input
                      name="full_name"
                      required
                      className="input-field"
                      placeholder="María Fernández"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Correo electrónico</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="input-field"
                      placeholder="maria@correo.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      name="email_verified"
                      type="checkbox"
                      id="email-verified"
                      checked={emailVerified}
                      onChange={(e) => setEmailVerified(e.target.checked)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <label htmlFor="email-verified" className="text-sm">
                      Ya verificaste tu correo
                    </label>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      className="input-field"
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Celular (opcional)</label>
                    <input
                      name="phone"
                      className="input-field"
                      placeholder="+51 987 654 321"
                      autoComplete="tel"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {submitting ? "Creando cuenta..." : "Crear cuenta"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{" "}
                  <Link to="/app/login" className="font-medium text-primary hover:underline">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
      <CookieBanner />
    </>
  );
}
