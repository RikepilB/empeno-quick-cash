import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".dev.vars") });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .dev.vars");
  process.exit(1);
}

if (!DEMO_PASSWORD || DEMO_PASSWORD.length < 8) {
  console.error("Missing SEED_DEMO_PASSWORD in .dev.vars (>=8 chars). See docs/DEVELOPMENT.md.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================================
// Users
// ============================================================================

type SeedUser = {
  email: string;
  full_name: string;
  role: "client" | "business";
  business_name?: string;
  district?: string;
  document_number?: string;
  phone?: string;
};

type SeedBusiness = SeedUser & {
  role: "business";
  business_name: string;
  district: string;
  plan: "free" | "starter" | "pro" | "unlim" | "basico" | "intermedio" | "avanzado";
  ruc: string;
  legal_name: string;
};

const TEST_CLIENT: SeedUser = {
  email: "cliente.test@empenalo.local",
  full_name: "Cliente Test",
  role: "client",
  document_number: "40000000",
  phone: "+51 999 000 000",
};

const TEST_BUSINESS: SeedBusiness = {
  email: "negocio.test@empenalo.local",
  full_name: "Negocio Test",
  role: "business",
  business_name: "Empeños Test",
  district: "Miraflores",
  plan: "avanzado",
  ruc: "20100000000",
  legal_name: "Empeños Test S.A.C.",
  phone: "+51 999 000 001",
};

const DEMO_CLIENTS: SeedUser[] = [
  {
    email: "demo.cliente1@empenalo.local",
    full_name: "María González",
    role: "client",
    document_number: "40000001",
    phone: "+51 999 100 001",
  },
  {
    email: "demo.cliente2@empenalo.local",
    full_name: "Carlos Mendoza",
    role: "client",
    document_number: "40000002",
    phone: "+51 999 100 002",
  },
  {
    email: "demo.cliente3@empenalo.local",
    full_name: "Lucía Torres",
    role: "client",
    document_number: "40000003",
    phone: "+51 999 100 003",
  },
  {
    email: "demo.cliente4@empenalo.local",
    full_name: "Javier Ruiz",
    role: "client",
    document_number: "40000004",
    phone: "+51 999 100 004",
  },
  {
    email: "demo.cliente5@empenalo.local",
    full_name: "Ana Castillo",
    role: "client",
    document_number: "40000005",
    phone: "+51 999 100 005",
  },
];

const DEMO_BUSINESSES: SeedBusiness[] = [
  {
    email: "demo.negocio1@empenalo.local",
    full_name: "Pedro Sánchez",
    role: "business",
    business_name: "Joyería Miraflores",
    district: "Miraflores",
    plan: "starter",
    ruc: "20100000001",
    legal_name: "Joyería Miraflores S.A.C.",
    phone: "+51 999 200 001",
  },
  {
    email: "demo.negocio2@empenalo.local",
    full_name: "Rosa Díaz",
    role: "business",
    business_name: "Empeños Lima Centro",
    district: "Cercado de Lima",
    plan: "free",
    ruc: "20100000002",
    legal_name: "Empeños Lima Centro E.I.R.L.",
    phone: "+51 999 200 002",
  },
  {
    email: "demo.negocio3@empenalo.local",
    full_name: "Luis Herrera",
    role: "business",
    business_name: "Casa Oro Surco",
    district: "Santiago de Surco",
    plan: "pro",
    ruc: "20100000003",
    legal_name: "Casa Oro Surco S.A.C.",
    phone: "+51 999 200 003",
  },
  {
    email: "demo.negocio4@empenalo.local",
    full_name: "Diana Flores",
    role: "business",
    business_name: "Préstamos San Isidro",
    district: "San Isidro",
    plan: "starter",
    ruc: "20100000004",
    legal_name: "Préstamos San Isidro S.A.C.",
    phone: "+51 999 200 004",
  },
  {
    email: "demo.negocio5@empenalo.local",
    full_name: "Miguel Vargas",
    role: "business",
    business_name: "Oro Express San Borja",
    district: "San Borja",
    plan: "unlim",
    ruc: "20100000005",
    legal_name: "Oro Express San Borja S.A.C.",
    phone: "+51 999 200 005",
  },
];

// ============================================================================
// Solicitudes — 30 across 11 categorías
// ============================================================================

type SolicitudTemplate = {
  category: string;
  brand: string | null;
  model: string;
  year: number | null;
  storage: string | null;
  condition: "Nuevo" | "Bueno" | "Regular";
  description: string;
  expected_amount_pen: number;
  expected_term_days: number;
  district: string;
  detalles?: Record<string, unknown>;
};

const SOLICITUD_TEMPLATES: SolicitudTemplate[] = [
  // Celular ×6
  {
    category: "celular",
    brand: "Apple",
    model: "iPhone 14 Pro",
    year: 2023,
    storage: "256 GB",
    condition: "Bueno",
    description: "Ligero rayón en marco superior. Pantalla y batería perfectas.",
    expected_amount_pen: 2500,
    expected_term_days: 30,
    district: "Miraflores",
    detalles: { battery_health: 92, almacenamiento_gb: 256 },
  },
  {
    category: "celular",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    year: 2023,
    storage: "256 GB",
    condition: "Bueno",
    description: "Mica desde día uno. Cargador original incluido.",
    expected_amount_pen: 2100,
    expected_term_days: 30,
    district: "San Isidro",
    detalles: { battery_health: 95, almacenamiento_gb: 256 },
  },
  {
    category: "celular",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    year: 2022,
    storage: "128 GB",
    condition: "Regular",
    description: "Batería al 82%. Funciona perfecto.",
    expected_amount_pen: 1600,
    expected_term_days: 30,
    district: "Santiago de Surco",
    detalles: { battery_health: 82, almacenamiento_gb: 128 },
  },
  {
    category: "celular",
    brand: "Xiaomi",
    model: "13T Pro",
    year: 2023,
    storage: "512 GB",
    condition: "Nuevo",
    description: "Desempaquetado pero sin uso. Plásticos puestos.",
    expected_amount_pen: 1500,
    expected_term_days: 30,
    district: "Santiago de Surco",
    detalles: { battery_health: 100, almacenamiento_gb: 512 },
  },
  {
    category: "celular",
    brand: "Google",
    model: "Pixel 8 Pro",
    year: 2023,
    storage: "256 GB",
    condition: "Bueno",
    description: "Caja original. Sin detalles visibles.",
    expected_amount_pen: 1900,
    expected_term_days: 30,
    district: "Miraflores",
    detalles: { battery_health: 93, almacenamiento_gb: 256 },
  },
  {
    category: "celular",
    brand: "Apple",
    model: "iPhone 15",
    year: 2024,
    storage: "128 GB",
    condition: "Nuevo",
    description: "Sellado. Garantía Apple vigente 11 meses.",
    expected_amount_pen: 2800,
    expected_term_days: 45,
    district: "San Isidro",
    detalles: { battery_health: 100, almacenamiento_gb: 128 },
  },

  // Laptop ×4
  {
    category: "laptop",
    brand: "Apple",
    model: 'MacBook Pro M2 14"',
    year: 2023,
    storage: "512 GB SSD",
    condition: "Nuevo",
    description: "Comprado hace 3 meses. Factura. Garantía.",
    expected_amount_pen: 5500,
    expected_term_days: 60,
    district: "San Isidro",
    detalles: { ram_gb: 16, ssd_gb: 512 },
  },
  {
    category: "laptop",
    brand: "Dell",
    model: "XPS 13 Plus",
    year: 2022,
    storage: "1 TB SSD",
    condition: "Bueno",
    description: "Pantalla OLED. Teclado táctil. Cuidada.",
    expected_amount_pen: 3200,
    expected_term_days: 30,
    district: "Miraflores",
    detalles: { ram_gb: 32, ssd_gb: 1024 },
  },
  {
    category: "laptop",
    brand: "Lenovo",
    model: "ThinkPad X1 Carbon",
    year: 2022,
    storage: "512 GB SSD",
    condition: "Bueno",
    description: "Empresarial. Batería excelente.",
    expected_amount_pen: 2800,
    expected_term_days: 45,
    district: "San Isidro",
    detalles: { ram_gb: 16, ssd_gb: 512 },
  },
  {
    category: "laptop",
    brand: "HP",
    model: "Spectre x360",
    year: 2023,
    storage: "512 GB SSD",
    condition: "Nuevo",
    description: "Convertible 2-en-1. Stylus incluido.",
    expected_amount_pen: 3600,
    expected_term_days: 30,
    district: "San Isidro",
    detalles: { ram_gb: 16, ssd_gb: 512 },
  },

  // Joya ×4
  {
    category: "joya",
    brand: null,
    model: "Anillo de oro 18k",
    year: null,
    storage: null,
    condition: "Bueno",
    description: "8.4 g de oro amarillo 18k. Diseño clásico.",
    expected_amount_pen: 1200,
    expected_term_days: 45,
    district: "Miraflores",
    detalles: { tipo_joya: "anillo", material: "oro", kilataje: 18, peso_g: 8.4 },
  },
  {
    category: "joya",
    brand: null,
    model: "Cadena de oro 14k",
    year: null,
    storage: null,
    condition: "Regular",
    description: "12 g. Eslabón requiere soldadura. Valor en oro.",
    expected_amount_pen: 900,
    expected_term_days: 30,
    district: "San Borja",
    detalles: { tipo_joya: "cadena", material: "oro", kilataje: 14, peso_g: 12 },
  },
  {
    category: "joya",
    brand: null,
    model: "Pulsera de plata 925",
    year: null,
    storage: null,
    condition: "Bueno",
    description: "20 g. Artesanal peruano. Caja terciopelo.",
    expected_amount_pen: 450,
    expected_term_days: 15,
    district: "Miraflores",
    detalles: { tipo_joya: "pulsera", material: "plata", kilataje: null, peso_g: 20 },
  },
  {
    category: "joya",
    brand: null,
    model: "Aros de oro 18k",
    year: null,
    storage: null,
    condition: "Nuevo",
    description: "3 g. Diseño minimalista. Caja de regalo.",
    expected_amount_pen: 380,
    expected_term_days: 15,
    district: "Miraflores",
    detalles: { tipo_joya: "aros", material: "oro", kilataje: 18, peso_g: 3 },
  },

  // Reloj ×3
  {
    category: "reloj",
    brand: "Tissot",
    model: "PRX Powermatic 80",
    year: 2022,
    storage: null,
    condition: "Nuevo",
    description: "Caja original y papeles. Sin uso.",
    expected_amount_pen: 1800,
    expected_term_days: 30,
    district: "San Isidro",
  },
  {
    category: "reloj",
    brand: "Casio",
    model: "G-Shock GA-2100",
    year: 2023,
    storage: null,
    condition: "Nuevo",
    description: "Edición Carbon Core Guard. Sin estrenar.",
    expected_amount_pen: 600,
    expected_term_days: 15,
    district: "San Borja",
  },
  {
    category: "reloj",
    brand: "Fossil",
    model: "Machine FS4656",
    year: 2021,
    storage: null,
    condition: "Bueno",
    description: "Automático. Correa cuero original.",
    expected_amount_pen: 350,
    expected_term_days: 15,
    district: "San Borja",
  },

  // Vehículo ×3
  {
    category: "vehiculo",
    brand: "Toyota",
    model: "Yaris 1.3",
    year: 2019,
    storage: null,
    condition: "Bueno",
    description: "Sedán. 65,000 km. SOAT vigente. Único dueño.",
    expected_amount_pen: 12000,
    expected_term_days: 60,
    district: "Santiago de Surco",
    detalles: {
      kilometraje: 65000,
      transmision: "manual",
      combustible: "gasolina",
      soat_vigente: true,
      revision_tecnica: true,
    },
  },
  {
    category: "vehiculo",
    brand: "Hyundai",
    model: "Accent",
    year: 2020,
    storage: null,
    condition: "Bueno",
    description: "Sedán. 48,000 km. Mantenimientos al día.",
    expected_amount_pen: 14000,
    expected_term_days: 90,
    district: "San Borja",
    detalles: {
      kilometraje: 48000,
      transmision: "automatico",
      combustible: "gasolina",
      soat_vigente: true,
      revision_tecnica: true,
    },
  },
  {
    category: "vehiculo",
    brand: "Kia",
    model: "Picanto",
    year: 2021,
    storage: null,
    condition: "Bueno",
    description: "Hatchback. 30,000 km. Ideal ciudad.",
    expected_amount_pen: 10500,
    expected_term_days: 60,
    district: "Cercado de Lima",
    detalles: {
      kilometraje: 30000,
      transmision: "manual",
      combustible: "gasolina",
      soat_vigente: true,
      revision_tecnica: true,
    },
  },

  // Moto ×2
  {
    category: "moto",
    brand: "Honda",
    model: "CBR 250R",
    year: 2021,
    storage: null,
    condition: "Bueno",
    description: "Deportiva. 8,500 km. SOAT vigente.",
    expected_amount_pen: 4200,
    expected_term_days: 45,
    district: "Cercado de Lima",
    detalles: { kilometraje: 8500, cilindrada_cc: 250, soat_vigente: true },
  },
  {
    category: "moto",
    brand: "Yamaha",
    model: "NMAX 155",
    year: 2022,
    storage: null,
    condition: "Bueno",
    description: "Scooter automático. 12,000 km. Único dueño.",
    expected_amount_pen: 3800,
    expected_term_days: 60,
    district: "Santiago de Surco",
    detalles: { kilometraje: 12000, cilindrada_cc: 155, soat_vigente: true },
  },

  // Electrodoméstico ×2
  {
    category: "electrodomestico",
    brand: "Samsung",
    model: 'Smart TV 65" QLED',
    year: 2023,
    storage: null,
    condition: "Nuevo",
    description: "Caja original. Garantía 22 meses restantes.",
    expected_amount_pen: 2200,
    expected_term_days: 30,
    district: "San Isidro",
  },
  {
    category: "electrodomestico",
    brand: "LG",
    model: "Refrigerador InstaView 30 cu.ft",
    year: 2022,
    storage: null,
    condition: "Bueno",
    description: "Door-in-door. Filtro de agua incluido.",
    expected_amount_pen: 2800,
    expected_term_days: 45,
    district: "Miraflores",
  },

  // Consola ×2
  {
    category: "consola",
    brand: "Sony",
    model: "PlayStation 5 Slim",
    year: 2024,
    storage: "1 TB",
    condition: "Nuevo",
    description: "Edición digital. 1 mes uso. 2 controles.",
    expected_amount_pen: 1400,
    expected_term_days: 30,
    district: "Cercado de Lima",
  },
  {
    category: "consola",
    brand: "Microsoft",
    model: "Xbox Series X",
    year: 2023,
    storage: "1 TB",
    condition: "Bueno",
    description: "Caja completa. 1 control. Pads de repuesto.",
    expected_amount_pen: 1500,
    expected_term_days: 30,
    district: "San Borja",
  },

  // Cámara ×1
  {
    category: "camara",
    brand: "Canon",
    model: "EOS R6 Mark II",
    year: 2023,
    storage: null,
    condition: "Nuevo",
    description: "Cuerpo solo. 2,000 disparos. Garantía 2025.",
    expected_amount_pen: 4800,
    expected_term_days: 60,
    district: "Cercado de Lima",
    detalles: { tipo: "mirrorless", incluye_lente: false, disparos: 2000 },
  },

  // Herramienta ×1
  {
    category: "herramienta",
    brand: "DeWalt",
    model: "Combo 5 herramientas 20V MAX",
    year: 2023,
    storage: null,
    condition: "Bueno",
    description: "Taladro, atornillador, sierra, lijadora, linterna. 2 baterías.",
    expected_amount_pen: 1100,
    expected_term_days: 30,
    district: "Cercado de Lima",
  },

  // Instrumento musical ×1
  {
    category: "instrumento",
    brand: "Fender",
    model: "Stratocaster Player Series",
    year: 2022,
    storage: null,
    condition: "Bueno",
    description: "Guitarra eléctrica. Funda incluida. Cuerdas nuevas.",
    expected_amount_pen: 1300,
    expected_term_days: 45,
    district: "Santiago de Surco",
  },

  // Lujo ×1
  {
    category: "lujo",
    brand: "Louis Vuitton",
    model: "Neverfull MM",
    year: 2023,
    storage: null,
    condition: "Nuevo",
    description: "Bolso autenticado. Dust bag y certificado.",
    expected_amount_pen: 3400,
    expected_term_days: 60,
    district: "Miraflores",
    detalles: { tipo_articulo: "bolso", autenticado: true },
  },
];

// ============================================================================
// Helpers
// ============================================================================

async function createUser(u: SeedUser) {
  const attempt = () =>
    supabase.auth.admin.createUser({
      email: u.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: u.role,
        full_name: u.full_name,
        business_name: u.business_name,
        district: u.district,
      },
    });

  let { data, error } = await attempt();
  if (error && (error.status === 422 || error.code === "email_exists")) {
    // Email was reserved by a previous hard-deleted account or paginated past
    // the listUsers sweep — find + delete the stale row, then retry once.
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const stale = (list?.users ?? []).find((x) => x.email === u.email);
    if (stale) {
      await supabase.auth.admin.deleteUser(stale.id);
    }
    ({ data, error } = await attempt());
  }
  if (error) throw error;
  return data.user!;
}

async function updateClientProfile(userId: string, u: SeedUser) {
  const [first, ...rest] = u.full_name.split(" ");
  const last = rest.join(" ");
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: first ?? u.full_name,
      last_name: last || null,
      document_type: "DNI",
      document_number: u.document_number ?? null,
      phone: u.phone ?? null,
      district: u.district ?? "Miraflores",
      city: "Lima",
    })
    .eq("id", userId);
  if (error) throw error;
}

async function upgradeBusiness(userId: string, b: SeedBusiness) {
  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .single<{ id: string }>();
  if (bizErr || !biz) throw new Error(`Business not created for ${b.email}: ${bizErr?.message}`);

  const { error: updErr } = await supabase
    .from("businesses")
    .update({
      ruc: b.ruc,
      legal_name: b.legal_name,
      trade_name: b.business_name,
      phone: b.phone,
      district: b.district,
      city: "Lima",
      verification_status: "verified",
      status: "active",
    })
    .eq("id", biz.id);
  if (updErr) throw updErr;

  const { error: subErr } = await supabase
    .from("subscriptions")
    .update({
      plan_id: b.plan,
      status: "active",
      propuestas_used_this_period: 0,
      featured_credits_used_this_period: 0,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("business_id", biz.id);
  if (subErr) throw subErr;

  return biz.id;
}

async function deleteExistingDemoUsers() {
  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const targets = (list?.users ?? []).filter(
    (u) =>
      u.email?.startsWith("demo.") ||
      u.email === TEST_CLIENT.email ||
      u.email === TEST_BUSINESS.email,
  );
  if (targets.length === 0) {
    console.log("  No existing demo/test users to clean");
    return;
  }

  // 0006 introduced ON DELETE RESTRICT on payments + commissions referencing
  // businesses. Clear those (and featured_offers, which has CASCADE but is
  // cheaper to truncate first) before letting user-cascade fire.
  const { data: bizRows } = await supabase
    .from("businesses")
    .select("id")
    .in(
      "owner_id",
      targets.map((u) => u.id),
    );
  const bizIds = (bizRows ?? []).map((b) => b.id);

  if (bizIds.length > 0) {
    // Order matters: commissions FK propuesta_id (cascade), payments FK related_entity_id (no FK).
    // featured_offers references propuesta_id (cascade) + payments (no FK in 0006 — manual column).
    await supabase.from("commissions").delete().in("business_id", bizIds);
    await supabase.from("featured_offers").delete().in("business_id", bizIds);
    await supabase.from("payments").delete().in("business_id", bizIds);
  }

  let totalDeleted = 0;
  for (const u of targets) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) {
      console.log(`  ! delete ${u.email}: ${error.message}`);
      continue;
    }
    totalDeleted++;
  }
  console.log(`  Deleted ${totalDeleted}/${targets.length} existing demo/test users`);
}

async function seedClients() {
  const ids: { userId: string; meta: SeedUser }[] = [];
  for (const u of [TEST_CLIENT, ...DEMO_CLIENTS]) {
    const user = await createUser(u);
    await updateClientProfile(user.id, u);
    ids.push({ userId: user.id, meta: u });
    console.log(`  Client: ${u.full_name} (${u.email})`);
  }
  return ids;
}

async function seedBusinesses() {
  const out: { userId: string; businessId: string; meta: SeedBusiness }[] = [];
  for (const b of [TEST_BUSINESS, ...DEMO_BUSINESSES]) {
    const user = await createUser(b);
    await updateClientProfile(user.id, { ...b, district: b.district });
    const businessId = await upgradeBusiness(user.id, b);
    out.push({ userId: user.id, businessId, meta: b });
    console.log(`  Business: ${b.business_name} [${b.plan}] (${b.email})`);
  }
  return out;
}

async function seedSolicitudes(clients: { userId: string; meta: SeedUser }[]) {
  const ids: string[] = [];
  for (let i = 0; i < SOLICITUD_TEMPLATES.length; i++) {
    const t = SOLICITUD_TEMPLATES[i];
    const clientId = clients[i % clients.length].userId;
    const { data, error } = await supabase
      .from("solicitudes")
      .insert({
        client_id: clientId,
        category: t.category,
        brand: t.brand,
        model: t.model,
        year: t.year,
        storage: t.storage,
        condition: t.condition,
        description: t.description,
        expected_amount_pen: t.expected_amount_pen,
        expected_term_days: t.expected_term_days,
        district: t.district,
      })
      .select("id")
      .single<{ id: string }>();
    if (error) throw error;
    ids.push(data.id);
  }
  console.log(
    `  ${ids.length} solicitudes seeded across ${new Set(SOLICITUD_TEMPLATES.map((t) => t.category)).size} categorías`,
  );
  return ids;
}

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

async function seedPropuestas(
  solicitudIds: string[],
  businesses: { businessId: string; meta: SeedBusiness }[],
) {
  const propuestaIds: { id: string; solicitud_id: string; business_id: string }[] = [];
  const r = rng(42);
  for (let i = 0; i < solicitudIds.length; i++) {
    const sid = solicitudIds[i];
    const t = SOLICITUD_TEMPLATES[i];
    // Distribution: ~25% × 1 prop, ~50% × 2 props, ~25% × 3 props
    const numPropuestas = i % 4 === 3 ? 3 : i % 4 === 0 ? 1 : 2;
    const shuffled = [...businesses].sort(() => r() - 0.5);
    for (let j = 0; j < numPropuestas; j++) {
      const biz = shuffled[j];
      const baseAmount = t.expected_amount_pen;
      const monto = Math.round(baseAmount * (0.4 + r() * 0.35)); // 40–75%
      const tasa = Number((3.5 + r() * 4.5).toFixed(2)); // 3.5–8.0
      const plazo = [15, 30, 60][Math.floor(r() * 3)];
      const { data, error } = await supabase
        .from("propuestas")
        .insert({
          solicitud_id: sid,
          business_id: biz.businessId,
          monto_pen: monto,
          tasa_mensual: tasa,
          plazo_dias: plazo,
        })
        .select("id")
        .single<{ id: string }>();
      if (error) throw error;
      propuestaIds.push({ id: data.id, solicitud_id: sid, business_id: biz.businessId });
    }
  }
  console.log(`  ${propuestaIds.length} propuestas seeded`);
  return propuestaIds;
}

async function acceptSomePropuestas(
  propuestas: { id: string; solicitud_id: string; business_id: string }[],
) {
  const seen = new Set<string>();
  const toAccept: typeof propuestas = [];
  for (const p of propuestas) {
    if (seen.has(p.solicitud_id)) continue;
    seen.add(p.solicitud_id);
    toAccept.push(p);
    if (toAccept.length >= 8) break; // 5 pending pickup + 3 completed
  }
  const operations: { propuesta_id: string; operation_id: string; redemption_code: string }[] = [];
  for (let i = 0; i < toAccept.length; i++) {
    const p = toAccept[i];
    const code = `EMP-SD${String(i + 1).padStart(3, "0")}`;
    const { data, error } = await supabase.rpc("accept_propuesta", {
      p_propuesta_id: p.id,
      p_redemption_code: code,
    });
    if (error) throw error;
    const op = Array.isArray(data) ? data[0] : data;
    operations.push({
      propuesta_id: p.id,
      operation_id: (op as { id: string }).id,
      redemption_code: code,
    });
  }
  console.log(`  ${operations.length} propuestas accepted`);
  return operations;
}

async function closeSomeOperations(operations: { operation_id: string }[]) {
  // Mark 3 as completed, 1 as disputed (post-accept)
  const completed = operations.slice(0, 3);
  for (const o of completed) {
    const { error } = await supabase
      .from("operations")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", o.operation_id);
    if (error) throw error;
  }
  if (operations.length >= 4) {
    const { error } = await supabase
      .from("operations")
      .update({ status: "disputed" })
      .eq("id", operations[3].operation_id);
    if (error) throw error;
  }
  console.log(
    `  ${completed.length} operations completed, ${operations.length >= 4 ? 1 : 0} disputed`,
  );
}

async function seedFeaturedOffers(
  propuestas: { id: string; business_id: string }[],
  businesses: { businessId: string; meta: SeedBusiness }[],
) {
  // boost_propuesta RPC requires auth.uid(); service-role calls bypass it.
  // Insert featured_offers directly to bypass the RPC for seeding only.
  const eligibleBusinesses = new Set(
    businesses
      .filter((b) => ["starter", "pro", "unlim"].includes(b.meta.plan))
      .map((b) => b.businessId),
  );
  const candidates = propuestas.filter((p) => eligibleBusinesses.has(p.business_id)).slice(0, 4);
  let created = 0;
  for (let i = 0; i < candidates.length; i++) {
    const p = candidates[i];
    const useCredit = i < 2;
    let paymentId: string | null = null;
    const costPen = useCredit ? 0 : i === 2 ? 9 : 15;

    if (!useCredit) {
      const { data: payment, error: payErr } = await supabase
        .from("payments")
        .insert({
          business_id: p.business_id,
          purpose: "featured_boost",
          amount_pen: costPen,
          status: "succeeded",
          gateway: "culqi",
          idempotency_key: `seed-payment-${p.id}`,
        })
        .select("id")
        .single<{ id: string }>();
      if (payErr) {
        console.log(`  (payment insert skipped: ${payErr.message})`);
        continue;
      }
      paymentId = payment.id;
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
    const { error } = await supabase.from("featured_offers").insert({
      propuesta_id: p.id,
      business_id: p.business_id,
      source: useCredit ? "plan_credit" : "purchased",
      duration_hours: 24,
      cost_pen: costPen,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_id: paymentId,
    });
    if (error) {
      console.log(`  (featured_offer insert skipped for ${p.id}: ${error.message})`);
      continue;
    }

    // If used a credit, increment the business's featured_credits_used_this_period
    if (useCredit) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, featured_credits_used_this_period")
        .eq("business_id", p.business_id)
        .single<{ id: string; featured_credits_used_this_period: number }>();
      if (sub) {
        await supabase
          .from("subscriptions")
          .update({ featured_credits_used_this_period: sub.featured_credits_used_this_period + 1 })
          .eq("id", sub.id);
      }
    }

    created++;
  }
  console.log(`  ${created} featured_offers created`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("\n🌱 EMPEÑALO — Database Seeder (Phase 3)\n");

  console.log("1. Cleaning existing demo users...");
  await deleteExistingDemoUsers();

  console.log("\n2. Creating clients...");
  const clients = await seedClients();

  console.log("\n3. Creating businesses + subscriptions...");
  const businesses = await seedBusinesses();

  console.log("\n4. Creating solicitudes...");
  const solicitudIds = await seedSolicitudes(clients);

  console.log("\n5. Creating propuestas...");
  const propuestas = await seedPropuestas(solicitudIds, businesses);

  console.log("\n6. Accepting subset of propuestas...");
  const operations = await acceptSomePropuestas(propuestas);

  console.log("\n7. Closing some operations...");
  await closeSomeOperations(operations);

  console.log("\n8. Featured offers (post-0006)...");
  await seedFeaturedOffers(propuestas, businesses);

  console.log("\n✅ Seeding complete!");
  console.log(`   ${1 + DEMO_CLIENTS.length} clients`);
  console.log(
    `   ${1 + DEMO_BUSINESSES.length} businesses (plans: ${[TEST_BUSINESS, ...DEMO_BUSINESSES].map((b) => b.plan).join(", ")})`,
  );
  console.log(
    `   ${SOLICITUD_TEMPLATES.length} solicitudes (${new Set(SOLICITUD_TEMPLATES.map((t) => t.category)).size} categorías)`,
  );
  console.log(`   ${propuestas.length} propuestas`);
  console.log(`   ${operations.length} accepted operations`);
  console.log("\nTest credentials:");
  console.log(`   Client:   ${TEST_CLIENT.email} / ${DEMO_PASSWORD}`);
  console.log(`   Business: ${TEST_BUSINESS.email} / ${DEMO_PASSWORD}`);
  console.log("\nRun `bun run scripts/seed-verify.ts` to validate.");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
