import { CATEGORIES } from "./constants";

export type SeedPropuesta = {
  client_email: string;
  business_email: string;
  category: (typeof CATEGORIES)[number];
  brand: string | null;
  model: string | null;
  monto_pen: number;
  tasa_mensual: number;
  plazo_dias: number;
  status: "pending" | "accepted" | "rejected" | "expired";
};

export const PROPUESTAS: SeedPropuesta[] = [
  // ── iPhone 14 Pro (cliente1, Miraflores, S/2500) — 3 ofertas ─────────────
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "celular",
    brand: "Apple",
    model: "iPhone 14 Pro",
    monto_pen: 1700,
    tasa_mensual: 5.5,
    plazo_dias: 30,
    status: "pending",
  },
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio5@empenalo.test",
    category: "celular",
    brand: "Apple",
    model: "iPhone 14 Pro",
    monto_pen: 1500,
    tasa_mensual: 4.5,
    plazo_dias: 30,
    status: "pending",
  },
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio2@empenalo.test",
    category: "celular",
    brand: "Apple",
    model: "iPhone 14 Pro",
    monto_pen: 1850,
    tasa_mensual: 6.5,
    plazo_dias: 30,
    status: "pending",
  },

  // ── Galaxy S23 Ultra (cliente2, San Isidro, S/2100) — 2 ofertas ──────────
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio2@empenalo.test",
    category: "celular",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    monto_pen: 1400,
    tasa_mensual: 5,
    plazo_dias: 30,
    status: "pending",
  },
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "celular",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    monto_pen: 1300,
    tasa_mensual: 4.5,
    plazo_dias: 30,
    status: "rejected",
  },

  // ── iPhone 13 Pro Max (cliente3, Surco, S/1600) — 2 ofertas ──────────────
  {
    client_email: "cliente3@empenalo.test",
    business_email: "negocio3@empenalo.test",
    category: "celular",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    monto_pen: 1000,
    tasa_mensual: 5.5,
    plazo_dias: 30,
    status: "pending",
  },
  {
    client_email: "cliente3@empenalo.test",
    business_email: "negocio4@empenalo.test",
    category: "celular",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    monto_pen: 850,
    tasa_mensual: 6,
    plazo_dias: 30,
    status: "pending",
  },

  // ── Pixel 8 Pro (cliente5, La Molina, S/1900) — accepted scenario ────────
  {
    client_email: "cliente5@empenalo.test",
    business_email: "negocio3@empenalo.test",
    category: "celular",
    brand: "Google",
    model: "Pixel 8 Pro",
    monto_pen: 1200,
    tasa_mensual: 5,
    plazo_dias: 30,
    status: "accepted",
  },
  {
    client_email: "cliente5@empenalo.test",
    business_email: "negocio2@empenalo.test",
    category: "celular",
    brand: "Google",
    model: "Pixel 8 Pro",
    monto_pen: 1100,
    tasa_mensual: 4.5,
    plazo_dias: 30,
    status: "expired",
  },

  // ── MacBook Pro M2 (cliente2, San Isidro, S/5500) — 3 ofertas ────────────
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio2@empenalo.test",
    category: "laptop",
    brand: "Apple",
    model: 'MacBook Pro M2 14"',
    monto_pen: 3800,
    tasa_mensual: 4.5,
    plazo_dias: 60,
    status: "pending",
  },
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio3@empenalo.test",
    category: "laptop",
    brand: "Apple",
    model: 'MacBook Pro M2 14"',
    monto_pen: 3500,
    tasa_mensual: 4,
    plazo_dias: 60,
    status: "pending",
  },
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "laptop",
    brand: "Apple",
    model: 'MacBook Pro M2 14"',
    monto_pen: 4100,
    tasa_mensual: 6,
    plazo_dias: 60,
    status: "pending",
  },

  // ── XPS 13 Plus (cliente1, Miraflores, S/3200) — 2 ofertas ───────────────
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "laptop",
    brand: "Dell",
    model: "XPS 13 Plus",
    monto_pen: 2000,
    tasa_mensual: 5,
    plazo_dias: 30,
    status: "pending",
  },
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio5@empenalo.test",
    category: "laptop",
    brand: "Dell",
    model: "XPS 13 Plus",
    monto_pen: 2200,
    tasa_mensual: 6,
    plazo_dias: 30,
    status: "pending",
  },

  // ── Pulsera oro 18k (cliente1, Miraflores, S/3500) — accepted ────────────
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "joya",
    brand: null,
    model: "Pulsera oro 18k con diamantes",
    monto_pen: 2400,
    tasa_mensual: 4,
    plazo_dias: 60,
    status: "accepted",
  },
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio5@empenalo.test",
    category: "joya",
    brand: null,
    model: "Pulsera oro 18k con diamantes",
    monto_pen: 2200,
    tasa_mensual: 4.5,
    plazo_dias: 60,
    status: "expired",
  },

  // ── Rolex Submariner (cliente2, San Isidro, S/12000) — 3 ofertas ─────────
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio2@empenalo.test",
    category: "reloj",
    brand: "Rolex",
    model: "Submariner Date",
    monto_pen: 8000,
    tasa_mensual: 3.5,
    plazo_dias: 60,
    status: "pending",
  },
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio3@empenalo.test",
    category: "reloj",
    brand: "Rolex",
    model: "Submariner Date",
    monto_pen: 7500,
    tasa_mensual: 3.5,
    plazo_dias: 60,
    status: "pending",
  },
  {
    client_email: "cliente2@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "reloj",
    brand: "Rolex",
    model: "Submariner Date",
    monto_pen: 9000,
    tasa_mensual: 4,
    plazo_dias: 60,
    status: "pending",
  },

  // ── PS5 Slim (cliente6, Miraflores, S/1900) — 2 ofertas ──────────────────
  {
    client_email: "cliente6@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "videojuego",
    brand: "Sony",
    model: "PlayStation 5 Slim",
    monto_pen: 1100,
    tasa_mensual: 5,
    plazo_dias: 30,
    status: "pending",
  },
  {
    client_email: "cliente6@empenalo.test",
    business_email: "negocio5@empenalo.test",
    category: "videojuego",
    brand: "Sony",
    model: "PlayStation 5 Slim",
    monto_pen: 1300,
    tasa_mensual: 6,
    plazo_dias: 30,
    status: "pending",
  },

  // ── Stumpjumper MTB (cliente1, Miraflores, S/5800) — 1 oferta ────────────
  {
    client_email: "cliente1@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "bicicleta",
    brand: "Specialized",
    model: "Stumpjumper Comp Alloy",
    monto_pen: 3000,
    tasa_mensual: 5,
    plazo_dias: 60,
    status: "pending",
  },

  // ── Sony Alpha A7 IV (cliente6, Miraflores, S/7200) — 2 ofertas ──────────
  {
    client_email: "cliente6@empenalo.test",
    business_email: "negocio1@empenalo.test",
    category: "camara",
    brand: "Sony",
    model: "Alpha A7 IV",
    monto_pen: 4500,
    tasa_mensual: 4.5,
    plazo_dias: 60,
    status: "accepted",
  },
  {
    client_email: "cliente6@empenalo.test",
    business_email: "negocio5@empenalo.test",
    category: "camara",
    brand: "Sony",
    model: "Alpha A7 IV",
    monto_pen: 4200,
    tasa_mensual: 5,
    plazo_dias: 60,
    status: "expired",
  },
];
