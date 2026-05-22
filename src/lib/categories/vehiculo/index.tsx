import { z } from "zod";

export const vehiculoSchema = z.object({
  marca: z.string().optional(),
  modelo: z.string().optional(),
  año: z.number().int().min(1990).max(2030).optional(),
  placa: z.string().optional(),
  tipo_combustible: z.enum(["Gasolina", "Diiesel", "Híbrido", "Eléctrico", "GNV"]).optional(),
});

export function VehiculoFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Marca</label>
          <input name="marca" className="input-field" placeholder="Toyota, Hyundai" />
        </div>
        <div>
          <label className="label-field">Modelo</label>
          <input name="modelo" className="input-field" placeholder="Yaris 1.3" />
        </div>
        <div>
          <label className="label-field">Año</label>
          <input
            name="año"
            type="number"
            inputMode="numeric"
            className="input-field"
            placeholder="2019"
          />
        </div>
        <div>
          <label className="label-field">Placa</label>
          <input
            name="placa"
            className="input-field"
            placeholder="ABC-123"
            style={{ textTransform: "uppercase" }}
          />
        </div>
      </div>

      <div>
        <label className="label-field">Tipo de combustible</label>
        <select name="tipo_combustible" className="input-field">
          <option value="">Seleccionar</option>
          <option value="Gasolina">Gasolina</option>
          <option value="Diiesel">Diiesel</option>
          <option value="Híbrido">Híbrido</option>
          <option value="Eléctrico">Eléctrico</option>
          <option value="GNV">GNV</option>
        </select>
      </div>
    </>
  );
}
