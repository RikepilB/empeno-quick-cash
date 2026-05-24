import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { safeRedirect } from "@/lib/safe-redirect";
import { loginWithPassword, getCurrentUser, signOut } from "@/services/auth";
import { Logo } from "@/ui/Logo";
import { CookieBanner } from "@/ui/CookieBanner";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/negocio/login")({
  component: BusinessLogin,
  validateSearch: searchSchema,
});

function BusinessLogin() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/negocio/login" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 30_000,
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      await loginWithPassword({ data: { email, password } });

      let profile = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 500));
        const user = await getCurrentUser();
        if (user) {
          profile = user.profile;
          break;
        }
      }

      if (!profile) {
        await signOut();
        throw new Error("Tu cuenta aún se está creando. Espera unos segundos e intenta de nuevo.");
      }
      if (profile.role !== "business") {
        await signOut();
        throw new Error(
          "Esta cuenta no pertenece a este portal. Usa el portal de clientes para iniciar sesión.",
        );
      }

      await navigate({ to: safeRedirect(search.redirect, "/negocio/dashboard") });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
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
            <span className="mt-2 inline-block rounded-md bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Panel de negocio
            </span>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Recibe solicitudes calificadas. Envía propuestas con un clic. Haz crecer tu casa de
              empeño.
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
              <span className="ml-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                B2B
              </span>
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
                <span className="mt-1 inline-block rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                  Panel de negocio
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
                <h1 className="font-display text-2xl font-bold">Iniciar sesión</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Accede al panel de gestión de tu casa de empeño.
                </p>

                {currentUser.data?.profile && currentUser.data.profile.role === "client" && (
                  <div className="mt-4 rounded-lg border border-status-pending/30 bg-status-pending/10 px-4 py-3 text-sm">
                    <p className="font-semibold text-status-pending">
                      Ya iniciaste sesión como cliente.
                    </p>
                    <Link to="/app/dashboard" className="text-xs text-primary hover:underline">
                      Ir a tu panel B2C →
                    </Link>
                  </div>
                )}

                <form onSubmit={onSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Correo</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="input-field"
                      placeholder="contacto@tunegocio.pe"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <label className="text-sm font-medium">Contraseña</label>
                      <Link
                        to="/negocio/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      className="input-field"
                      autoComplete="current-password"
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
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    {submitting ? "Entrando..." : "Entrar al panel"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  ¿Nueva casa de empeño?{" "}
                  <Link to="/negocio/register" className="font-medium text-primary hover:underline">
                    Crear cuenta de negocio
                  </Link>
                </p>
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                <Link to="/app/login" className="hover:text-foreground">
                  Soy cliente →
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
      <CookieBanner />
    </>
  );
}
