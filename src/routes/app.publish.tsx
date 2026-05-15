import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Camera, Plus, Smartphone, Laptop, Gem, Watch, Car, Box } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/publish")({ component: Publish });

const cats = [
  { k: "celular", l: "Celular", icon: Smartphone },
  { k: "laptop", l: "Laptop", icon: Laptop },
  { k: "joya", l: "Joya", icon: Gem },
  { k: "reloj", l: "Reloj", icon: Watch },
  { k: "vehiculo", l: "Vehículo", icon: Car },
  { k: "otro", l: "Otro", icon: Box },
];

function Publish() {
  const [cat, setCat] = useState("celular");

  return (
    <PhoneFrame title="Publicar artículo" back="/app/dashboard">
      <div className="space-y-5 p-6 pb-10">
        <div>
          <label className="label-field">Categoría</label>
          <div className="grid grid-cols-3 gap-2">
            {cats.map((c) => {
              const Icon = c.icon;
              const active = cat === c.k;
              return (
                <button key={c.k} onClick={() => setCat(c.k)} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                  {c.l}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">Marca</label>
            <input className="input-field" defaultValue="Apple" />
          </div>
          <div>
            <label className="label-field">Modelo</label>
            <input className="input-field" defaultValue="iPhone 14 Pro" />
          </div>
          <div>
            <label className="label-field">Año</label>
            <input className="input-field" defaultValue="2023" />
          </div>
          <div>
            <label className="label-field">Almacenamiento</label>
            <input className="input-field" defaultValue="256 GB" />
          </div>
        </div>

        <div>
          <label className="label-field">Estado del artículo</label>
          <div className="grid grid-cols-4 gap-2">
            {["Nuevo", "Bueno", "Regular", "Detalles"].map((e, i) => (
              <button key={e} className={`rounded-lg border px-2 py-2 text-xs ${i === 1 ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label-field">Imperfecciones (opcional)</label>
          <textarea className="input-field min-h-[70px]" defaultValue="Ligero rayón en el marco superior. Pantalla y batería en perfecto estado." />
        </div>

        <div>
          <label className="label-field">Fotografías (mín. 2 · máx. 8)</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-surface-2 to-surface text-center text-3xl leading-[5rem]">📱</div>
            ))}
            <button className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary">
              <Camera className="h-5 w-5" />
              <span className="mt-1 text-[10px]">Agregar</span>
            </button>
          </div>
        </div>

        <details className="group rounded-xl border border-border bg-surface">
          <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium">
            Opciones avanzadas
            <Plus className="h-4 w-4 transition group-open:rotate-45" />
          </summary>
          <div className="space-y-4 border-t border-border p-4">
            <div>
              <label className="label-field">Monto esperado (S/)</label>
              <input className="input-field" placeholder="2,500" />
            </div>
            <div>
              <label className="label-field">Plazo deseado</label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((d) => (
                  <button key={d} className={`rounded-lg border py-2 text-xs ${d === 30 ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}>
                    {d} días
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-field">Documentos de respaldo</label>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background py-3 text-xs text-muted-foreground hover:border-primary hover:text-primary">
                <Plus className="h-4 w-4" /> Boleta / Certificado
              </button>
            </div>
          </div>
        </details>

        <Link to="/app/published" className="btn-primary w-full">Publicar y esperar propuestas</Link>
      </div>
    </PhoneFrame>
  );
}
