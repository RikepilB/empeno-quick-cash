import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/ui/BusinessLayout";
import { Loader2, Building2, KeyRound, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBusinessProfile, updateBusiness, type BusinessProfile } from "@/services/business";
import { changePassword } from "@/services/auth";

export const Route = createFileRoute("/negocio/perfil")({ component: Cuenta });

function Cuenta() {
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["businessProfile"],
    queryFn: () => getBusinessProfile(),
  });

  if (profile.isLoading) {
    return (
      <BusinessLayout title="Cuenta" subtitle="Datos de tu negocio">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </BusinessLayout>
    );
  }

  const data = profile.data;

  if (!data) {
    return (
      <BusinessLayout title="Cuenta" subtitle="Datos de tu negocio">
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
          No encontramos tu negocio. Vuelve a iniciar sesión.
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout title="Cuenta" subtitle="Datos de tu negocio">
      <div className="grid gap-6 lg:grid-cols-3">
        <BusinessDetailsCard
          data={data}
          onSaved={() => qc.invalidateQueries({ queryKey: ["businessProfile"] })}
        />
        <div className="space-y-6">
          <VerificationCard status={data.verification_status} />
          <PasswordCard />
        </div>
      </div>
    </BusinessLayout>
  );
}

function BusinessDetailsCard({ data, onSaved }: { data: BusinessProfile; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const ruc = String(form.get("ruc") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const district = String(form.get("district") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();

    if (!name) {
      setError("El nombre del negocio es obligatorio.");
      return;
    }
    if (ruc && !/^\d{11}$/u.test(ruc)) {
      setError("El RUC debe tener 11 dígitos.");
      return;
    }

    setSaving(true);
    try {
      await updateBusiness({
        data: {
          name,
          ruc: ruc || null,
          phone: phone || null,
          district: district || null,
          address: address || null,
        },
      });
      setMsg("Cambios guardados.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar tu cuenta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2"
    >
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl font-bold uppercase">Datos del negocio</h3>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del negocio" className="sm:col-span-2">
          <input name="name" defaultValue={data.name ?? ""} required className="input-field" />
        </Field>

        <Field label="RUC">
          <input
            name="ruc"
            defaultValue={data.ruc ?? ""}
            inputMode="numeric"
            maxLength={11}
            placeholder="11 dígitos"
            className="input-field"
          />
        </Field>

        <Field label="Teléfono">
          <input
            name="phone"
            defaultValue={data.phone ?? ""}
            placeholder="+51 ..."
            className="input-field"
          />
        </Field>

        <Field label="Distrito">
          <input
            name="district"
            defaultValue={data.district ?? ""}
            placeholder="Ej. Miraflores"
            className="input-field"
          />
        </Field>

        <Field label="Dirección">
          <input
            name="address"
            defaultValue={data.address ?? ""}
            placeholder="Av. / Jr. ..."
            className="input-field"
          />
        </Field>

        <Field label="Correo (no editable)" className="sm:col-span-2">
          <input value={data.email ?? "—"} disabled className="input-field opacity-60" readOnly />
        </Field>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}
      {msg && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-status-accepted/10 px-3 py-2 text-xs text-status-accepted">
          <CheckCircle2 className="h-3.5 w-3.5" /> {msg}
        </div>
      )}

      <button type="submit" disabled={saving} className="btn-primary mt-5 disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

function VerificationCard({ status }: { status: BusinessProfile["verification_status"] }) {
  const map = {
    verified: {
      label: "Verificado",
      cls: "text-status-accepted",
      desc: "Tu negocio está verificado.",
    },
    pending: {
      label: "Pendiente",
      cls: "text-status-pending",
      desc: "Verificación en revisión. Completa tus datos para acelerarla.",
    },
    rejected: {
      label: "Rechazado",
      cls: "text-destructive",
      desc: "No pudimos verificar tu negocio. Revisa tus datos.",
    },
  } as const;
  const v = map[status];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold uppercase">Verificación</h3>
      </div>
      <div className={`mt-3 text-sm font-semibold ${v.cls}`}>{v.label}</div>
      <p className="mt-1 text-xs text-muted-foreground">{v.desc}</p>
    </div>
  );
}

function PasswordCard() {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setError(null);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      await changePassword({ data: { currentPassword, newPassword } });
      setMsg("Contraseña actualizada.");
      formEl.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg font-bold uppercase">Cambiar contraseña</h3>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Contraseña actual">
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="input-field"
          />
        </Field>
        <Field label="Nueva contraseña">
          <input
            name="newPassword"
            type="password"
            required
            autoComplete="new-password"
            className="input-field"
          />
        </Field>
        <Field label="Confirmar nueva contraseña">
          <input
            name="confirm"
            type="password"
            required
            autoComplete="new-password"
            className="input-field"
          />
        </Field>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</div>
      )}
      {msg && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-status-accepted/10 px-3 py-2 text-xs text-status-accepted">
          <CheckCircle2 className="h-3.5 w-3.5" /> {msg}
        </div>
      )}

      <button type="submit" disabled={saving} className="btn-primary mt-5 disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
