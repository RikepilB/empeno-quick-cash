import { createFileRoute } from "@tanstack/react-router";
import { BusinessLayout } from "@/components/BusinessLayout";
import { Upload, Plus, Star } from "lucide-react";

export const Route = createFileRoute("/negocio/perfil")({ component: Perfil });

const team = [
  { name: "Carlos Méndez", role: "Admin (tú)", email: "carlos@joymira.pe" },
  { name: "Lucía Tafur", role: "Operador", email: "lucia@joymira.pe" },
];

function Perfil() {
  return (
    <BusinessLayout title="Negocio" subtitle="Datos del negocio, plan y equipo">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plan card */}
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 lg:col-span-1">
          <div className="text-xs uppercase text-muted-foreground">Plan activo</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-display text-3xl font-extrabold">Intermedio</span>
            <span className="badge-dot badge-accepted">Activo</span>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <span className="font-display text-2xl font-bold">8/30</span>
            <span className="text-[11px] text-muted-foreground">propuestas usadas</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary" style={{ width: "27%" }} />
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Próxima renovación: <span className="font-semibold text-foreground">28 mayo 2026</span></div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="btn-ghost text-xs">Ver factura</button>
            <button className="btn-primary text-xs">Cambiar plan</button>
          </div>
        </div>

        {/* Business data */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <h3 className="font-display text-xl font-bold uppercase">Datos del negocio</h3>
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-primary text-primary" /> 4.9 · 320 operaciones
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-background p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/15 font-display text-2xl font-bold text-primary">JM</div>
            <div className="flex-1">
              <div className="font-semibold">Logotipo del negocio</div>
              <div className="text-[11px] text-muted-foreground">Visible junto a tus propuestas. PNG/JPG, máx. 2MB.</div>
            </div>
            <button className="rounded-lg border border-border bg-surface px-3 py-2 text-xs"><Upload className="h-3.5 w-3.5" /></button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label-field">Nombre comercial</label>
              <input className="input-field" defaultValue="Joyería Miraflores" />
            </div>
            <div>
              <label className="label-field">RUC</label>
              <input className="input-field" defaultValue="20512345678" disabled />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Dirección</label>
              <input className="input-field" defaultValue="Av. Larco 345, Of. 201 — Miraflores" />
            </div>
            <div>
              <label className="label-field">Teléfono</label>
              <input className="input-field" defaultValue="(01) 445-2210" />
            </div>
            <div>
              <label className="label-field">Horarios</label>
              <input className="input-field" defaultValue="Lun a Sáb · 9:00 – 19:00" />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button className="btn-ghost">Cancelar</button>
            <button className="btn-primary">Guardar cambios</button>
          </div>
        </div>

        {/* Team */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-bold uppercase">Equipo</h3>
            <button className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" /> Agregar empleado</button>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-[11px] uppercase text-muted-foreground">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {team.map((u) => (
                  <tr key={u.email} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold">{u.name}</td>
                    <td className="px-4 py-3"><span className="badge-dot badge-new">{u.role}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground"><button className="hover:text-foreground">Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
