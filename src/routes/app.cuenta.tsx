import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Loader2,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  updateProfile,
  changePassword,
  sendVerificationOtp,
  verifyEmailOtp,
} from "@/services/auth";

export const Route = createFileRoute("/app/cuenta")({ component: Cuenta });

function Cuenta() {
  const queryClient = useQueryClient();
  const user = useQuery({ queryKey: ["currentUser"], queryFn: () => getCurrentUser() });

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyCode, setVerifyCode] = useState(["", "", "", "", "", ""]);
  const [verifySent, setVerifySent] = useState(false);

  const profileMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setEditingName(false);
    },
  });

  const passwordMut = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordForm(false);
      setTimeout(() => setPasswordSuccess(false), 4000);
    },
  });

  const sendOtpMut = useMutation({
    mutationFn: () => sendVerificationOtp({ data: { email } }),
    onSuccess: () => setVerifySent(true),
  });

  const verifyOtpMut = useMutation({
    mutationFn: (token: string) => verifyEmailOtp({ data: { email, token } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setShowVerifyForm(false);
      setVerifyCode(["", "", "", "", "", ""]);
      setVerifySent(false);
    },
  });

  const profile = user.data?.profile;
  const email = user.data?.user.email ?? "";
  const emailVerified = !!user.data?.user.email_confirmed_at;

  useEffect(() => {
    if (profile?.phone) setPhoneDraft(profile.phone);
  }, [profile?.phone]);

  return (
    <ClientLayout title="Mi cuenta" subtitle="Gestiona tu perfil y seguridad">
      <div className="mx-auto max-w-2xl space-y-8">
        {!!user.data && (
          <>
            {/* Personal data */}
            <section className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold uppercase">Datos personales</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Nombre completo
                  </label>
                  {editingName ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className="input-field flex-1"
                        placeholder={profile?.full_name ?? "Tu nombre"}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          profileMut.mutate({ data: { full_name: nameDraft || undefined } });
                        }}
                        disabled={profileMut.isPending}
                        className="btn-primary px-4"
                      >
                        {profileMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Guardar"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingName(false)}
                        className="btn-ghost px-3"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm">{profile?.full_name ?? "—"}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setNameDraft(profile?.full_name ?? "");
                          setEditingName(true);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Correo electrónico
                  </label>
                  <div className="mt-1 flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {email}
                      {emailVerified ? (
                        <span className="rounded-full bg-status-accepted/15 px-1.5 py-0.5 text-[10px] text-status-accepted">
                          Verificado
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400">
                          Sin verificar
                        </span>
                      )}
                    </div>

                    {!emailVerified && !showVerifyForm && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowVerifyForm(true);
                          sendOtpMut.mutate();
                        }}
                        disabled={sendOtpMut.isPending}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        {sendOtpMut.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        Verificar correo
                      </button>
                    )}

                    {showVerifyForm && (
                      <div className="mt-2 rounded-lg border border-border bg-surface-2 p-4">
                        <p className="text-xs text-muted-foreground">
                          {verifySent
                            ? "Código enviado. Revisa tu bandeja de entrada."
                            : "Enviamos un código de 6 dígitos a tu correo."}
                        </p>
                        <div className="mt-3 flex gap-1.5">
                          {verifyCode.map((digit, i) => (
                            <input
                              key={i}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                if (!/^\d*$/.test(e.target.value)) return;
                                const next = [...verifyCode];
                                next[i] = e.target.value.slice(0, 1);
                                setVerifyCode(next);
                              }}
                              className="h-10 w-10 rounded-lg border border-border bg-surface text-center font-display text-lg font-bold focus:border-primary focus:outline-none"
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => verifyOtpMut.mutate(verifyCode.join(""))}
                            disabled={verifyOtpMut.isPending || verifyCode.join("").length !== 6}
                            className="btn-primary px-3 py-1 text-xs"
                          >
                            {verifyOtpMut.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Verificar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowVerifyForm(false);
                              setVerifyCode(["", "", "", "", "", ""]);
                              setVerifySent(false);
                            }}
                            className="btn-ghost px-2 py-1 text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                        {verifyOtpMut.isError && (
                          <div className="mt-2 rounded bg-red-500/10 px-3 py-1.5 text-[11px] text-red-400">
                            {verifyOtpMut.error.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Celular
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      className="input-field flex-1 text-sm"
                      placeholder={profile?.phone ?? "+51 987 654 321"}
                      onBlur={() => {
                        if (phoneDraft) {
                          profileMut.mutate({
                            data: { phone: phoneDraft || undefined },
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                {profileMut.isError && (
                  <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {profileMut.error.message}
                  </div>
                )}
                {profileMut.isSuccess && !editingName && (
                  <div className="rounded-lg bg-status-accepted/10 px-3 py-2 text-xs text-status-accepted">
                    Perfil actualizado.
                  </div>
                )}
              </div>
            </section>

            {/* Security */}
            <section className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold uppercase">Seguridad</h2>
              </div>

              {passwordSuccess && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-status-accepted/10 px-3 py-2 text-xs text-status-accepted">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Contraseña cambiada correctamente.
                </div>
              )}

              {showPasswordForm ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    passwordMut.mutate({ data: { currentPassword, newPassword } });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="input-field mt-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="input-field mt-1 w-full"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">Mínimo 8 caracteres.</p>
                  </div>

                  {passwordMut.isError && (
                    <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
                      {passwordMut.error.message}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="submit" disabled={passwordMut.isPending} className="btn-primary">
                      {passwordMut.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      {passwordMut.isPending ? "Cambiando..." : "Cambiar contraseña"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="btn-ghost"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm hover:bg-surface"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    Cambiar contraseña
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </section>

            {/* Account status */}
            <section className="rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold uppercase">Estado de cuenta</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rol</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Cliente
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="rounded-full bg-status-accepted/15 px-2 py-0.5 text-xs text-status-accepted">
                    Activo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Miembro desde</span>
                  <span>
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("es-PE")
                      : "—"}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        <div className="text-center">
          <Link to="/app/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
            Volver al panel
          </Link>
        </div>
      </div>
    </ClientLayout>
  );
}
