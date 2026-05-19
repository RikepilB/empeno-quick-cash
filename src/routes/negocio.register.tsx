import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowser } from "@/lib/db/browser";

export const Route = createFileRoute("/negocio/register")({ component: BusinessRegister });

function BusinessRegister() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const business_name = String(form.get("business_name") ?? "").trim();
      const district = String(form.get("district") ?? "").trim();
      const full_name = String(form.get("full_name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      const supabase = getSupabaseBrowser();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: "business", full_name, business_name, district } },
      });
      if (signUpError) throw signUpError;

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await navigate({ to: "/negocio/dashboard" });
      } else {
        await navigate({ to: "/negocio/login" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <aside className="hidden items-center justify-center border-r border-border bg-surface lg:flex">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary font-display text-4xl font-bold text-primary-foreground shadow-glow">
            E
          </div>
          <div className="mt-6 font-display text-3xl font-bold uppercase tracking-widest">
            EMPEÑALO
          </div>
          <span className="mt-2 inline-block rounded-md bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Panel de negocio
          </span>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Empiezas con el plan Básico gratis. Sin costo inicial. Actualiza cuando quieras.
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-display text-sm font-bold text-primary-foreground">
              E
            </div>
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
              <h1 className="font-display text-2xl font-bold">Registrar negocio</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Plan Básico gratis. Sin costo inicial. Actualiza cuando quieras.
              </p>

              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Nombre del negocio</label>
                  <input
                    name="business_name"
                    required
                    className="input-field"
                    placeholder="Joyería Miraflores"
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Distrito</label>
                  <input
                    name="district"
                    className="input-field"
                    placeholder="Miraflores"
                    autoComplete="address-level2"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Tu nombre (administrador)
                  </label>
                  <input
                    name="full_name"
                    required
                    className="input-field"
                    placeholder="Juan Pérez"
                    autoComplete="name"
                  />
                </div>
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
                  <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="input-field"
                    autoComplete="new-password"
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
                  {submitting ? "Registrando..." : "Crear cuenta de negocio"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <Link to="/negocio/login" className="font-medium text-primary hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
