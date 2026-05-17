import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

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
        options: {
          data: { role: "business", full_name, business_name, district },
        },
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-xl font-bold text-primary-foreground">
            E
          </div>
          <span className="font-display text-xl font-bold tracking-widest">EMPEÑALO</span>
          <span className="ml-auto rounded-md bg-surface-2 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">B2B</span>
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold uppercase">Registrar negocio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Empezamos con el plan Básico en modo prueba. Podrás activar el plan pagado más tarde.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label-field">Nombre del negocio</label>
            <input name="business_name" required className="input-field" placeholder="Joyería Miraflores" />
          </div>
          <div>
            <label className="label-field">Distrito</label>
            <input name="district" className="input-field" placeholder="Miraflores" />
          </div>
          <div>
            <label className="label-field">Tu nombre (administrador)</label>
            <input name="full_name" required className="input-field" placeholder="Juan Pérez" />
          </div>
          <div>
            <label className="label-field">Correo</label>
            <input name="email" type="email" required className="input-field" placeholder="contacto@tunegocio.pe" />
          </div>
          <div>
            <label className="label-field">Contraseña</label>
            <input name="password" type="password" required minLength={6} className="input-field" />
          </div>

          {error && (
            <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
            {submitting ? "Registrando..." : "Crear cuenta de negocio"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link to="/negocio/login" className="text-primary hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
