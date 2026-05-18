import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
import { Smartphone, Loader2 } from "lucide-react";
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
    <PhoneFrame title="Iniciar sesión">
      <form onSubmit={onSubmit} className="space-y-5 p-6">
        {search.confirm ? (
          <div className="rounded-lg bg-status-accepted/15 px-3 py-2 text-xs text-status-accepted">
            Revisa tu correo para confirmar la cuenta, luego inicia sesión.
          </div>
        ) : null}

        <div>
          <label className="label-field">Correo electrónico</label>
          <input name="email" type="email" required className="input-field" placeholder="tu@correo.com" />
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
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
          {submitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to="/app/register" className="text-primary hover:underline">Regístrate</Link>
          <br />
          <Link to="/negocio/login" className="mt-2 inline-block text-muted-foreground hover:text-foreground">
            Soy casa de empeño →
          </Link>
        </p>
      </form>
    </PhoneFrame>
  );
}
