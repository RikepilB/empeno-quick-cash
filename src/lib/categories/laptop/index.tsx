import { z } from "zod";

export const laptopSchema = z.object({
  marca: z.string().optional(),
  modelo: z.string().optional(),
  año_compra: z.number().int().min(2000).max(2030).optional(),
  procesador: z.string().optional(),
  reparada: z.boolean().optional(),
  estado: z.enum(["Nuevo", "Bueno", "Regular"]).optional(),
});

export function LaptopFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Marca</label>
          <input name="marca" className="input-field" placeholder="Apple, Dell, Lenovo" />
        </div>
        <div>
          <label className="label-field">Modelo</label>
          <input name="modelo" className="input-field" placeholder="MacBook Pro M2" />
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
          <label className="label-field">Procesador</label>
          <input name="procesador" className="input-field" placeholder="M2 Pro, i7-1260P" />
        </div>
      </div>

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
          name="reparada"
          type="checkbox"
          id="reparada-laptop"
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <label htmlFor="reparada-laptop" className="text-sm">
          Ha sido reparada
        </label>
      </div>
    </>
  );
}
