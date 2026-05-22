import { z } from "zod";
import { useState } from "react";

export const celularSchema = z.object({
  año_compra: z.number().int().min(2000).max(2030).optional(),
  modelo: z.string().optional(),
  almacenamiento: z.string().optional(),
  bateria_pct: z.number().int().min(0).max(100).optional(),
  estado: z.enum(["Nuevo", "Bueno", "Regular"]).optional(),
  reparado: z.boolean().optional(),
});

export function CelularFields() {
  const [brandValue, setBrandValue] = useState("");
  const showBateria = /iPhone|Apple/i.test(brandValue);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Marca</label>
          <input
            name="brand"
            className="input-field"
            placeholder="Apple"
            value={brandValue}
            onChange={(e) => setBrandValue(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Modelo</label>
          <input name="modelo" className="input-field" placeholder="iPhone 14 Pro" />
        </div>
        <div>
          <label className="label-field">Año de compra</label>
          <input
            name="año_compra"
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="2023"
          />
        </div>
        <div>
          <label className="label-field">Almacenamiento</label>
          <input name="almacenamiento" className="input-field" placeholder="256 GB" />
        </div>
      </div>

      {showBateria && (
        <div>
          <label className="label-field">% Batería (Salud)</label>
          <input
            name="bateria_pct"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            className="input-field"
            placeholder="92"
          />
        </div>
      )}

      <div>
        <label className="label-field">Estado</label>
        <select name="estado" className="input-field">
          <option value="">Seleccionar</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Bueno">Bueno</option>
          <option value="Regular">Regular</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          name="reparado"
          type="checkbox"
          id="reparado-celular"
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <label htmlFor="reparado-celular" className="text-sm">
          Ha sido reparado
        </label>
      </div>
    </>
  );
}
