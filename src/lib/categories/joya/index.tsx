import { z } from "zod";

export const joyaSchema = z.object({
  tipo: z.enum(["Anillo", "Collar", "Pulsera", "Areto", "Otro"]).optional(),
  material: z.enum(["Oro", "Plata", "Acero", "Otro"]).optional(),
  kilate: z.enum(["10K", "14K", "18K", "22K", "24K"]).optional(),
  peso: z.string().optional(),
  piedras: z.boolean().optional(),
  marca: z.string().optional(),
  tasacion_previa: z.boolean().optional(),
});

export function JoyaFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Tipo</label>
          <select name="tipo" className="input-field">
            <option value="">Seleccionar</option>
            <option value="Anillo">Anillo</option>
            <option value="Collar">Collar</option>
            <option value="Pulsera">Pulsera</option>
            <option value="Areto">Areto</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="label-field">Material</label>
          <select name="material" className="input-field">
            <option value="">Seleccionar</option>
            <option value="Oro">Oro</option>
            <option value="Plata">Plata</option>
            <option value="Acero">Acero</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div>
          <label className="label-field">Kilate</label>
          <select name="kilate" className="input-field">
            <option value="">Seleccionar</option>
            <option value="10K">10K</option>
            <option value="14K">14K</option>
            <option value="18K">18K</option>
            <option value="22K">22K</option>
            <option value="24K">24K</option>
          </select>
        </div>
        <div>
          <label className="label-field">Peso</label>
          <input name="peso" className="input-field" placeholder="5.2g" />
        </div>
      </div>

      <div>
        <label className="label-field">Marca</label>
        <input name="marca" className="input-field" placeholder="Cartier, Tiffany..." />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            name="piedras"
            type="checkbox"
            id="piedras-joya"
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <label htmlFor="piedras-joya" className="text-sm">
            Tiene piedras preciosas
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            name="tasacion_previa"
            type="checkbox"
            id="tasacion-previa"
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <label htmlFor="tasacion-previa" className="text-sm">
            Tengo tasación previa
          </label>
        </div>
      </div>
    </>
  );
}
