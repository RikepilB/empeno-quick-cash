import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, updateProfile, changePassword } from "@/services/auth";

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

  const profile = user.data?.profile;
  const email = user.data?.user.email ?? "";

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
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {email}
                    <span className="rounded-full bg-status-accepted/15 px-1.5 py-0.5 text-[10px] text-status-accepted">
                      Verificado
                    </span>
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
                      placeholder="+51 987 654 321"
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
                  <span>—</span>
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
