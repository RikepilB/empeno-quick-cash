import { z } from "zod";

export const relojSchema = z.object({
  marca: z.string().optional(),
  modelo: z.string().optional(),
  año_compra: z.number().int().min(2000).max(2030).optional(),
  material: z.enum(["Acero", "Oro", "Plata", "Piel", "Silicona"]).optional(),
  tiene_caja: z.boolean().optional(),
});

export function RelojFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Marca</label>
          <input name="marca" className="input-field" placeholder="Rolex, Tissot, Casio" />
        </div>
        <div>
          <label className="label-field">Modelo</label>
          <input name="modelo" className="input-field" placeholder="PRX Powermatic 80" />
        </div>
        <div>
          <label className="label-field">Año de compra</label>
          <input
            name="año_compra"
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="2022"
          />
        </div>
        <div>
          <label className="label-field">Material</label>
          <select name="material" className="input-field">
            <option value="">Seleccionar</option>
            <option value="Acero">Acero</option>
            <option value="Oro">Oro</option>
            <option value="Plata">Plata</option>
            <option value="Piel">Piel</option>
            <option value="Silicona">Silicona</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          name="tiene_caja"
          type="checkbox"
          id="tiene-caja-reloj"
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <label htmlFor="tiene-caja-reloj" className="text-sm">
          Tiene caja original
        </label>
      </div>
    </>
  );
}
