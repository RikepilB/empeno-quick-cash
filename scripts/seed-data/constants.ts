export const LIMA_DISTRICTS = [
  "Miraflores",
  "San Isidro",
  "Santiago de Surco",
  "La Molina",
  "San Borja",
  "Magdalena",
  "Pueblo Libre",
  "Jesús María",
  "Lince",
  "Barranco",
  "San Miguel",
  "Surquillo",
  "Chorrillos",
  "Cercado de Lima",
] as const;

export const CATEGORIES = ["celular", "laptop", "joya", "reloj", "vehiculo", "otro"] as const;

export const PLAN_SLUGS = ["basico", "intermedio", "avanzado"] as const;

export const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD;
if (!DEMO_PASSWORD) {
  throw new Error("SEED_DEMO_PASSWORD env var required for seeding (see docs/DEVELOPMENT.md)");
}
