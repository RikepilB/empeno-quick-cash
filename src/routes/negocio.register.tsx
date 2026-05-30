import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, CheckCircle, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { registerBusiness, sendVerificationOtp } from "@/services/auth";
import { Logo } from "@/ui/Logo";
import { CookieBanner } from "@/ui/CookieBanner";

export const Route = createFileRoute("/negocio/register")({ component: BusinessRegister });

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const HORA_APERTURA = ["09:00", "09:30", "10:00", "10:30", "11:00"];
const HORA_CIERRE = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

function BusinessRegister() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rucVerified, setRucVerified] = useState(false);
  const [rucLoading, setRucLoading] = useState(false);
  const [horario, setHorario] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >(Object.fromEntries(DIAS.map((d) => [d, { open: "09:00", close: "18:00", closed: false }])));

  function handleRucVerify(ruc: string) {
    if (!/^\d{11}$/.test(ruc)) return;
    setRucLoading(true);
    setTimeout(() => {
      setRucVerified(true);
      setRucLoading(false);
    }, 800);
  }

  function toggleClosed(dia: string) {
    setHorario((prev) => ({
      ...prev,
      [dia]: { ...prev[dia]!, closed: !prev[dia]!.closed },
    }));
  }

  function updateTime(dia: string, field: "open" | "close", value: string) {
    setHorario((prev) => ({
      ...prev,
      [dia]: { ...prev[dia]!, [field]: value },
    }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const business_name = String(form.get("business_name") ?? "").trim();
      const district = String(form.get("district") ?? "").trim();
      const ruc = String(form.get("ruc") ?? "").trim();
      const dni_rep_legal = String(form.get("dni_rep_legal") ?? "").trim();
      const full_name = String(form.get("full_name") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");

      const { sessionCreated } = await registerBusiness({
        data: {
          email,
          password,
          full_name,
          business_name,
          district: district || undefined,
          ruc: ruc || undefined,
          dni_rep_legal: dni_rep_legal || undefined,
          horario,
        },
      });
      if (sessionCreated) {
        try {
          await sendVerificationOtp({ data: { email } });
        } catch {
          // OTP send may fail silently
        }
        await navigate({ to: "/negocio/verify" });
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
              Acceso completo durante la beta. Sin costo. Sin límites.
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
                <h1 className="font-display text-2xl font-bold">Registrar negocio</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Beta — Acceso completo. Sin costo. Sin límites.
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
                    <label className="mb-1.5 block text-sm font-medium">RUC</label>
                    <div className="flex gap-2">
                      <input
                        name="ruc"
                        required
                        pattern="\d{11}"
                        maxLength={11}
                        inputMode="numeric"
                        className="input-field flex-1"
                        placeholder="20123456789"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleRucVerify(String(new FormData(document.forms[0]!).get("ruc") ?? ""))
                        }
                        disabled={rucLoading || rucVerified}
                        className={`btn-secondary shrink-0 ${rucVerified ? "border-status-approved text-status-approved" : ""}`}
                      >
                        {rucLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : rucVerified ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          "Verificar RUC"
                        )}
                      </button>
                    </div>
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
                      DNI del representante legal
                    </label>
                    <input
                      name="dni_rep_legal"
                      required
                      pattern="\d{8}"
                      maxLength={8}
                      inputMode="numeric"
                      className="input-field"
                      placeholder="87654321"
                      autoComplete="off"
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
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Horario de atención</label>
                    <div className="space-y-2 rounded-lg border border-border p-3">
                      {DIAS.map((dia) => (
                        <div key={dia} className="flex items-center gap-3">
                          <div className="w-8 text-xs font-medium text-muted-foreground">{dia}</div>
                          <input
                            type="checkbox"
                            checked={!horario[dia]!.closed}
                            onChange={() => toggleClosed(dia)}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          <select
                            value={horario[dia]!.open}
                            onChange={(e) => updateTime(dia, "open", e.target.value)}
                            disabled={horario[dia]!.closed}
                            className="input-field flex-1 text-xs"
                          >
                            {HORA_APERTURA.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-muted-foreground">a</span>
                          <select
                            value={horario[dia]!.close}
                            onChange={(e) => updateTime(dia, "close", e.target.value)}
                            disabled={horario[dia]!.closed}
                            className="input-field flex-1 text-xs"
                          >
                            {HORA_CIERRE.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
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
      <CookieBanner />
    </>
  );
}
