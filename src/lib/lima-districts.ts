// Canonical Lima district list — single source of truth for district pickers,
// autocomplete, business address validation, district filter dropdowns.
// See docs/UI-UX.md §"Lima districts (canonical list)".

export const LIMA_DISTRICTS = [
  "Miraflores",
  "San Isidro",
  "Santiago de Surco",
  "San Borja",
  "Cercado de Lima",
  "La Molina",
  "Surquillo",
  "Barranco",
  "Chorrillos",
  "Pueblo Libre",
  "Magdalena",
  "Jesús María",
  "Lince",
  "San Miguel",
  "Los Olivos",
  "Independencia",
  "San Martín de Porres",
  "Comas",
  "Callao",
  "Bellavista",
  "La Victoria",
  "Breña",
  "Rímac",
  "Ate",
  "Santa Anita",
  "San Luis",
  "El Agustino",
  "San Juan de Lurigancho",
  "San Juan de Miraflores",
  "Villa El Salvador",
  "Villa María del Triunfo",
  "Lurín",
  "Pachacámac",
] as const;

export type LimaDistrict = (typeof LIMA_DISTRICTS)[number];

const districtSet = new Set<string>(LIMA_DISTRICTS);

export function isLimaDistrict(value: string | null | undefined): value is LimaDistrict {
  return value != null && districtSet.has(value);
}
