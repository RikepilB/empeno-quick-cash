import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useState, useRef, type FormEvent, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, sendVerificationOtp, verifyEmailOtp } from "@/services/auth";
import { Logo } from "@/ui/Logo";

export const Route = createFileRoute("/negocio/verify")({ component: BusinessVerify });

function BusinessVerify() {
  const navigate = useNavigate();
  const user = useQuery({ queryKey: ["currentUser"], queryFn: () => getCurrentUser() });
  const email = user.data?.user.email ?? "";
  const alreadyVerified = !!user.data?.user.email_confirmed_at;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (alreadyVerified) {
      navigate({ to: "/negocio/dashboard" });
    }
  }, [alreadyVerified, navigate]);

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(0, 1);
    setCode(next);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    if (!email) return;
    setError(null);
    try {
      await sendVerificationOtp({ data: { email } });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reenviar");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = code.join("");
    if (token.length !== 6) {
      setError("Ingresa el código de 6 dígitos.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await verifyEmailOtp({ data: { email, token } });
      await user.refetch();
      navigate({ to: "/negocio/dashboard" });
    } catch (err) {
      setError("Código incorrecto o expirado. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (user.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
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
            Verifica tu correo para activar todas las funciones de tu cuenta de negocio.
          </p>
        </div>
      </aside>

      <main className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-4 md:px-8">
          <Link
            to="/negocio/dashboard"
            aria-label="Volver al panel"
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
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-bold">Verifica tu correo</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviamos un código de 6 dígitos a
                <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>

              <form onSubmit={onSubmit} className="mt-8">
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInput(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="h-14 w-12 rounded-xl border border-border bg-surface-2 text-center font-display text-2xl font-bold text-foreground focus:border-primary focus:outline-none transition"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {error}
                  </div>
                )}

                {resent && (
                  <div className="mt-4 rounded-lg bg-status-accepted/10 px-3 py-2 text-xs text-status-accepted">
                    Código reenviado. Revisa tu bandeja de entrada.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || code.join("").length !== 6}
                  className="btn-primary mt-6 w-full disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Verificando..." : "Verificar"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                className="mt-4 text-xs text-primary hover:underline"
              >
                <Mail className="mr-1 inline h-3 w-3" />
                Reenviar código
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/negocio/dashboard" className="hover:text-foreground">
                Verificar más tarde →
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
