import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { getSupabaseBrowser } from "@/lib/db/browser";
import { safeRedirect } from "@/lib/safe-redirect";

const searchSchema = z.object({
  redirect: z.string().optional(),
  confirm: z.coerce.number().optional(),
});

export const Route = createFileRoute("/app/login")({
  component: Login,
  validateSearch: searchSchema,
});

function Login() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/app/login" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      const supabase = getSupabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      await navigate({ to: safeRedirect(search.redirect, "/app/dashboard") });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* Left — brand panel (desktop only) */}
      <aside className="hidden items-center justify-center border-r border-border bg-surface lg:flex">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary font-display text-4xl font-bold text-primary-foreground shadow-glow">
            E
          </div>
          <div className="mt-6 font-display text-3xl font-bold uppercase tracking-widest">
            EMPEÑALO
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Empeña tu artículo y recibe múltiples ofertas reales de casas de empeño verificadas.
          </p>
        </div>
      </aside>

      {/* Right — form */}
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              E
            </div>
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
              <h1 className="font-display text-2xl font-bold">Iniciar sesión</h1>
              <p className="mt-1 text-sm text-muted-foreground">Accede a tu cuenta de cliente.</p>

              {search.confirm && (
                <div className="mt-4 rounded-lg bg-primary-dim px-3 py-2 text-xs text-primary">
                  Revisa tu correo para confirmar la cuenta, luego inicia sesión.
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Correo electrónico</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="input-field"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label className="text-sm font-medium">Contraseña</label>
                    <Link
                      to="/app/forgot-password"
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
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link to="/app/register" className="font-medium text-primary hover:underline">
                  Regístrate
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/negocio/login" className="hover:text-foreground">
                Soy casa de empeño →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
