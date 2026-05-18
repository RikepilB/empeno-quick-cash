import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
import { Smartphone, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowser } from "@/lib/db/browser";

export const Route = createFileRoute("/app/register")({ component: Register });

function Register() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const full_name = String(form.get("full_name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");
      const phone = String(form.get("phone") ?? "").trim();

      const supabase = getSupabaseBrowser();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        phone: phone || undefined,
        options: { data: { role: "client", full_name } },
      });
      if (signUpError) throw signUpError;

      // If email confirmation is disabled in Supabase dashboard, a session is created immediately
      // and beforeLoad on /app/dashboard will pass. Otherwise the user will see the login page.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
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
    <PhoneFrame title="Crear cuenta" back="/app/login">
      <form onSubmit={onSubmit} className="space-y-5 p-6">
        <div>
          <label className="label-field">Nombre completo</label>
          <input name="full_name" required className="input-field" placeholder="María Fernández Castro" />
        </div>
        <div>
          <label className="label-field">Correo electrónico</label>
          <input name="email" type="email" required className="input-field" placeholder="maria@correo.com" />
        </div>
        <div>
          <label className="label-field">Contraseña</label>
          <input name="password" type="password" required minLength={6} className="input-field" placeholder="Mínimo 6 caracteres" />
        </div>
        <div>
          <label className="label-field">Celular (opcional)</label>
          <input name="phone" className="input-field" placeholder="+51 987 654 321" />
        </div>

        {error && (
          <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
            {error}
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
          {submitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/app/login" className="text-primary hover:underline">Inicia sesión</Link>
        </p>
      </form>
    </PhoneFrame>
  );
}
