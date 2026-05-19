import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load env from .dev.vars (server-side secrets)
config({ path: resolve(process.cwd(), ".dev.vars") });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .dev.vars");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================================
// Demo data
// ============================================================================

const DEMO_CLIENTS = [
  {
    email: "demo.cliente1@empenalo.local",
    password: "Demo2026!",
    full_name: "María González",
    role: "client",
  },
  {
    email: "demo.cliente2@empenalo.local",
    password: "Demo2026!",
    full_name: "Carlos Mendoza",
    role: "client",
  },
  {
    email: "demo.cliente3@empenalo.local",
    password: "Demo2026!",
    full_name: "Lucía Torres",
    role: "client",
  },
  {
    email: "demo.cliente4@empenalo.local",
    password: "Demo2026!",
    full_name: "Javier Ruiz",
    role: "client",
  },
  {
    email: "demo.cliente5@empenalo.local",
    password: "Demo2026!",
    full_name: "Ana Castillo",
    role: "client",
  },
];

const DEMO_BUSINESSES = [
  {
    email: "demo.negocio1@empenalo.local",
    password: "Demo2026!",
    full_name: "Pedro Sánchez",
    role: "business",
    business_name: "Joyería Miraflores",
    district: "Miraflores",
  },
  {
    email: "demo.negocio2@empenalo.local",
    password: "Demo2026!",
    full_name: "Rosa Díaz",
    role: "business",
    business_name: "Empeños Lima Centro",
    district: "Cercado de Lima",
  },
  {
    email: "demo.negocio3@empenalo.local",
    password: "Demo2026!",
    full_name: "Luis Herrera",
    role: "business",
    business_name: "Casa Oro Surco",
    district: "Santiago de Surco",
  },
  {
    email: "demo.negocio4@empenalo.local",
    password: "Demo2026!",
    full_name: "Diana Flores",
    role: "business",
    business_name: "Préstamos San Isidro",
    district: "San Isidro",
  },
  {
    email: "demo.negocio5@empenalo.local",
    password: "Demo2026!",
    full_name: "Miguel Vargas",
    role: "business",
    business_name: "Oro Express San Borja",
    district: "San Borja",
  },
];

const SOLICITUD_TEMPLATES = [
  {
    category: "celular",
    brand: "Apple",
    model: "iPhone 14 Pro",
    year: 2023,
    storage: "256 GB",
    condition: "Bueno",
    description: "Ligero rayón en el marco superior. Pantalla y batería en perfecto estado.",
    expected_amount_pen: 2500,
    expected_term_days: 30,
    district: "Miraflores",
  },
  {
    category: "reloj",
    brand: "Tissot",
    model: "PRX Powermatic 80",
    year: 2022,
    storage: null,
    condition: "Nuevo",
    description: "Con caja original y papeles. Sin uso, recibido como regalo.",
    expected_amount_pen: 1800,
    expected_term_days: 30,
    district: "San Isidro",
  },
  {
    category: "joya",
    brand: null,
    model: "Anillo de oro 18k",
    year: null,
    storage: null,
    condition: "Bueno",
    description: "8.4 gramos de oro amarillo 18k. Diseño clásico con detalles.",
    expected_amount_pen: 1200,
    expected_term_days: 45,
    district: "Miraflores",
  },
  {
    category: "laptop",
    brand: "Apple",
    model: 'MacBook Pro M2 14"',
    year: 2023,
    storage: "512 GB SSD",
    condition: "Nuevo",
    description: "Comprado hace 3 meses. Factura disponible. Garantía vigente.",
    expected_amount_pen: 5500,
    expected_term_days: 60,
    district: "San Isidro",
  },
  {
    category: "celular",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    year: 2023,
    storage: "256 GB",
    condition: "Bueno",
    description: "Mica protectora aplicada desde el primer día. Cargador original incluido.",
    expected_amount_pen: 2100,
    expected_term_days: 30,
    district: "Surquillo",
  },
  {
    category: "joya",
    brand: null,
    model: "Cadena de oro 14k",
    year: null,
    storage: null,
    condition: "Regular",
    description: "12 gramos. Un eslabón requiere soldadura. Valor principal en el oro.",
    expected_amount_pen: 900,
    expected_term_days: 30,
    district: "San Borja",
  },
  {
    category: "vehiculo",
    brand: "Honda",
    model: "CBR 250R",
    year: 2021,
    storage: null,
    condition: "Bueno",
    description: "Moto deportiva. 8,500 km. SOAT vigente. Revisiones al día.",
    expected_amount_pen: 4200,
    expected_term_days: 45,
    district: "Cercado de Lima",
  },
  {
    category: "laptop",
    brand: "Dell",
    model: "XPS 13 Plus",
    year: 2022,
    storage: "1 TB SSD",
    condition: "Bueno",
    description: "Teclado táctil. Pantalla OLED. Muy cuidada.",
    expected_amount_pen: 3200,
    expected_term_days: 30,
    district: "Miraflores",
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
    category: "celular",
    brand: "Xiaomi",
    model: "13T Pro",
    year: 2023,
    storage: "512 GB",
    condition: "Nuevo",
    description: "Desempaquetado pero sin uso. Todavía tiene plásticos.",
    expected_amount_pen: 1500,
    expected_term_days: 30,
    district: "Santiago de Surco",
  },
  {
    category: "joya",
    brand: null,
    model: "Pulsera de plata 925",
    year: null,
    storage: null,
    condition: "Bueno",
    description: "20 gramos. Diseño artesanal peruano. Caja de terciopelo.",
    expected_amount_pen: 450,
    expected_term_days: 15,
    district: "Miraflores",
  },
  {
    category: "otro",
    brand: "PlayStation",
    model: "PS5 Slim",
    year: 2024,
    storage: "1 TB",
    condition: "Nuevo",
    description: "Edición digital. Comprado hace 1 mes. 2 controles incluidos.",
    expected_amount_pen: 1400,
    expected_term_days: 30,
    district: "Cercado de Lima",
  },
  {
    category: "laptop",
    brand: "Lenovo",
    model: "ThinkPad X1 Carbon",
    year: 2022,
    storage: "512 GB SSD",
    condition: "Bueno",
    description: "Empresarial. Batería en excelente estado.",
    expected_amount_pen: 2800,
    expected_term_days: 45,
    district: "San Isidro",
  },
  {
    category: "celular",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    year: 2022,
    storage: "128 GB",
    condition: "Regular",
    description: "Batería al 82%. Funciona perfecto. Cargador genérico.",
    expected_amount_pen: 1600,
    expected_term_days: 30,
    district: "Surquillo",
  },
  {
    category: "reloj",
    brand: "Fossil",
    model: "Machine FS4656",
    year: 2021,
    storage: null,
    condition: "Bueno",
    description: "Reloj automático. Correa de cuero original ligeramente usada.",
    expected_amount_pen: 350,
    expected_term_days: 15,
    district: "San Borja",
  },
  {
    category: "joya",
    brand: null,
    model: "Aros de oro 18k",
    year: null,
    storage: null,
    condition: "Nuevo",
    description: "3 gramos. Diseño minimalista. Con caja de regalo.",
    expected_amount_pen: 380,
    expected_term_days: 15,
    district: "Miraflores",
  },
  {
    category: "vehiculo",
    brand: "Yamaha",
    model: "NMAX 155",
    year: 2022,
    storage: null,
    condition: "Bueno",
    description: "Scooter automático. 12,000 km. Único dueño.",
    expected_amount_pen: 3800,
    expected_term_days: 60,
    district: "Santiago de Surco",
  },
  {
    category: "laptop",
    brand: "HP",
    model: "Spectre x360",
    year: 2023,
    storage: "512 GB SSD",
    condition: "Nuevo",
    description: "Convertible 2-en-1. Pantalla táctil. Stylus incluido.",
    expected_amount_pen: 3600,
    expected_term_days: 30,
    district: "San Isidro",
  },
  {
    category: "celular",
    brand: "Google",
    model: "Pixel 8 Pro",
    year: 2023,
    storage: "256 GB",
    condition: "Bueno",
    description: "Cámara excelente. Caja original. Sin detalles.",
    expected_amount_pen: 1900,
    expected_term_days: 30,
    district: "Miraflores",
  },
  {
    category: "otro",
    brand: "Canon",
    model: "EOS R6 Mark II",
    year: 2023,
    storage: null,
    condition: "Nuevo",
    description: "Cuerpo solo. 2,000 disparos. Garantía hasta 2025.",
    expected_amount_pen: 4800,
    expected_term_days: 60,
    district: "Cercado de Lima",
  },
];

// ============================================================================
// Helpers
// ============================================================================

async function createUser(u: (typeof DEMO_CLIENTS)[0]) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: {
      role: u.role,
      full_name: u.full_name,
      business_name: (u as any).business_name,
      district: (u as any).district,
    },
  });
  if (error) throw error;
  return data.user!;
}

async function deleteExistingUsers() {
  const { data: list } = await supabase.auth.admin.listUsers();
  const toDelete = (list?.users ?? []).filter((u) => u.email?.startsWith("demo."));
  for (const u of toDelete) {
    await supabase.auth.admin.deleteUser(u.id);
    console.log(`  Deleted existing demo user: ${u.email}`);
  }
}

async function seedClients() {
  const ids: string[] = [];
  for (const u of DEMO_CLIENTS) {
    const user = await createUser(u);
    ids.push(user.id);
    console.log(`  Created client: ${u.full_name} (${u.email})`);
  }
  return ids;
}

async function seedBusinesses() {
  const results: Array<{ userId: string; businessId: string }> = [];
  for (const u of DEMO_BUSINESSES) {
    const user = await createUser(u);
    // handle_new_user trigger auto-creates business + trialing subscription
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single<{ id: string }>();
    if (!biz) throw new Error(`Business not created for ${u.email}`);
    results.push({ userId: user.id, businessId: biz.id });
    console.log(`  Created business: ${u.business_name} (${u.email})`);
  }
  return results;
}

async function seedSolicitudes(clientIds: string[]) {
  const ids: string[] = [];
  for (let i = 0; i < SOLICITUD_TEMPLATES.length; i++) {
    const t = SOLICITUD_TEMPLATES[i];
    const clientId = clientIds[i % clientIds.length];
    const { data, error } = await supabase
      .from("solicitudes")
      .insert({ client_id: clientId, ...t })
      .select("id")
      .single<{ id: string }>();
    if (error) throw error;
    ids.push(data.id);
    console.log(`  Created solicitud: ${t.brand ?? ""} ${t.model} (${t.category})`);
  }
  return ids;
}

async function seedPropuestas(solicitudIds: string[], businessIds: string[]) {
  const propuestaIds: string[] = [];
  // Distribute propuestas so each solicitud gets 0-4 offers
  for (let i = 0; i < solicitudIds.length; i++) {
    const sid = solicitudIds[i];
    const numPropuestas = Math.floor(Math.random() * 5); // 0-4
    const shuffled = [...businessIds].sort(() => Math.random() - 0.5);
    for (let j = 0; j < numPropuestas; j++) {
      const bid = shuffled[j];
      const baseAmount = SOLICITUD_TEMPLATES[i].expected_amount_pen ?? 1000;
      const monto = Math.round(baseAmount * (0.7 + Math.random() * 0.3)); // 70-100% of expected
      const tasa = Number((3 + Math.random() * 4).toFixed(2)); // 3-7%
      const plazo = [15, 30, 45, 60][Math.floor(Math.random() * 4)];
      const { data, error } = await supabase
        .from("propuestas")
        .insert({
          solicitud_id: sid,
          business_id: bid,
          monto_pen: monto,
          tasa_mensual: tasa,
          plazo_dias: plazo,
        })
        .select("id")
        .single<{ id: string }>();
      if (error) throw error;
      propuestaIds.push(data.id);
      console.log(`    Propuesta ${j + 1}/${numPropuestas}: S/${monto} @ ${tasa}% / ${plazo}d`);
    }
  }
  return propuestaIds;
}

async function acceptSomePropuestas(propuestaIds: string[]) {
  // Pick one propuesta per solicitud to avoid sibling-expire conflicts.
  // Group by solicitud_id and accept the first propuesta from each group.
  const { data: rows } = await supabase
    .from("propuestas")
    .select("id, solicitud_id")
    .in("id", propuestaIds);

  const seen = new Set<string>();
  const toAccept: string[] = [];
  for (const r of rows ?? []) {
    if (seen.has(r.solicitud_id)) continue;
    seen.add(r.solicitud_id);
    toAccept.push(r.id);
    if (toAccept.length >= 5) break;
  }

  for (const pid of toAccept) {
    const code = `EMP-${Array.from({ length: 5 }, () => "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 32)]).join("")}`;
    const { error } = await supabase.rpc("accept_propuesta", {
      p_propuesta_id: pid,
      p_redemption_code: code,
    });
    if (error) throw error;
    console.log(`  Accepted propuesta → ${code}`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("\n🌱 EMPEÑALO — Database Seeder\n");

  console.log("1. Cleaning existing demo users...");
  await deleteExistingUsers();

  console.log("\n2. Creating demo clients...");
  const clientIds = await seedClients();

  console.log("\n3. Creating demo businesses...");
  const businesses = await seedBusinesses();
  const businessIds = businesses.map((b) => b.businessId);

  console.log("\n4. Creating solicitudes...");
  const solicitudIds = await seedSolicitudes(clientIds);

  console.log("\n5. Creating propuestas (offers)...");
  const propuestaIds = await seedPropuestas(solicitudIds, businessIds);

  console.log("\n6. Accepting some propuestas...");
  await acceptSomePropuestas(propuestaIds);

  console.log("\n✅ Seeding complete!");
  console.log(`   ${DEMO_CLIENTS.length} clients`);
  console.log(`   ${DEMO_BUSINESSES.length} businesses`);
  console.log(`   ${SOLICITUD_TEMPLATES.length} solicitudes`);
  console.log(`   ${propuestaIds.length} propuestas`);
  console.log(`   ${Math.min(5, propuestaIds.length)} accepted operations`);
  console.log("\nDemo login credentials:");
  console.log(`   Client:  ${DEMO_CLIENTS[0].email} / ${DEMO_CLIENTS[0].password}`);
  console.log(`   Business: ${DEMO_BUSINESSES[0].email} / ${DEMO_BUSINESSES[0].password}`);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
