import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound, Loader2, Mail } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { getSupabaseBrowser } from "@/lib/db/browser";

export const Route = createFileRoute("/app/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const marker = `${window.location.search}${window.location.hash}`;
    setResetMode(
      marker.includes("reset=1") ||
        marker.includes("type=recovery") ||
        marker.includes("access_token") ||
        marker.includes("code="),
    );
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim();
      if (!email) throw new Error("Ingresa tu correo electrónico");

      const supabase = getSupabaseBrowser();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/app/forgot-password?reset=1`
          : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (resetError) throw resetError;

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el correo de recuperación");
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const password = String(form.get("password") ?? "");
      if (password.length < 8) throw new Error("Usa al menos 8 caracteres.");

      const supabase = getSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setResetDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar la contraseña");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="flex items-center justify-between px-4 py-4 md:px-6">
        <Link
          to="/app/login"
          aria-label="Volver a inicio de sesión"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition hover:bg-surface-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground">
            E
          </div>
          <span className="font-display text-sm font-bold tracking-widest md:text-base">
            EMPEÑALO
          </span>
        </div>
        <div className="w-10" aria-hidden />
      </header>

      <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-10 pt-2 md:pt-8">
        <div className="md:rounded-2xl md:border md:border-border md:bg-surface md:p-8">
          <h1 className="font-display text-2xl font-bold uppercase">
            {resetMode ? "Crear nueva contraseña" : "Recuperar contraseña"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {resetMode
              ? "Elige una contraseña nueva para tu cuenta."
              : "Te enviaremos un enlace para restablecer tu contraseña."}
          </p>

          {resetDone ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg bg-status-accepted/15 px-4 py-3 text-sm text-status-accepted">
                Contraseña actualizada. Ya puedes iniciar sesión con tu nueva clave.
              </div>
              <Link to="/app/login" className="btn-primary w-full">
                Iniciar sesión
              </Link>
            </div>
          ) : resetMode ? (
            <form onSubmit={onReset} className="mt-6 space-y-5">
              <div>
                <label className="label-field">Nueva contraseña</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
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
                  <KeyRound className="h-4 w-4" />
                )}
                {submitting ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </form>
          ) : sent ? (
            <div className="mt-6 rounded-lg bg-status-accepted/15 px-4 py-3 text-sm text-status-accepted">
              Revisa tu correo. Si la dirección está registrada, recibirás un enlace para crear una
              nueva contraseña.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              <div>
                <label className="label-field">Correo electrónico</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="tu@correo.com"
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
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
                  <Mail className="h-4 w-4" />
                )}
                {submitting ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/app/login" className="text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
