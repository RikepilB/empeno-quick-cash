import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { safeRedirect } from "@/lib/safe-redirect";

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

      await navigate({ to: safeRedirect(search.redirect, "/negocio/dashboard") });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-xl font-bold text-primary-foreground">
            E
          </div>
          <span className="font-display text-xl font-bold tracking-widest">EMPEÑALO</span>
          <span className="ml-auto rounded-md bg-surface-2 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">B2B</span>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold uppercase">Panel de negocio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inicia sesión para ver solicitudes y enviar propuestas.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label-field">Correo</label>
            <input name="email" type="email" required className="input-field" placeholder="contacto@tunegocio.pe" />
          </div>
          <div>
            <label className="label-field">Contraseña</label>
            <input name="password" type="password" required className="input-field" />
          </div>

          {error && (
            <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            {submitting ? "Entrando..." : "Entrar al panel"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          ¿Nueva casa de empeño?{" "}
          <Link to="/negocio/register" className="text-primary hover:underline">Crear cuenta de negocio</Link>
          <br />
          <Link to="/app/login" className="mt-2 inline-block text-muted-foreground hover:text-foreground">
            Soy cliente →
          </Link>
        </p>
      </div>
    </div>
  );
}
