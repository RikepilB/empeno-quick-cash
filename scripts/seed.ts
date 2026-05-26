#!/usr/bin/env bun
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

import { BUSINESS_PROFILE_EXTRAS } from "./seed-data/businesses";
import { DEMO_PASSWORD } from "./seed-data/constants";
import { OPERATIONS } from "./seed-data/operations";
import { PROPUESTAS } from "./seed-data/propuestas";
import { SOLICITUDES } from "./seed-data/solicitudes";
import { BUSINESS_USERS, CLIENT_USERS } from "./seed-data/users";

config({ path: resolve(process.cwd(), ".dev.vars") });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .dev.vars");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const userIdByEmail = new Map<string, string>();
const businessIdByEmail = new Map<string, string>();
const solicitudIdByKey = new Map<string, string>();
const propuestaIdByKey = new Map<string, string>();

function solicitudKey(
  client_email: string,
  category: string,
  brand: string | null,
  model: string | null,
) {
  return `${client_email}|${category}|${brand ?? ""}|${model ?? ""}`;
}

function propuestaKey(
  client_email: string,
  business_email: string,
  category: string,
  brand: string | null,
  model: string | null,
) {
  return `${client_email}|${business_email}|${category}|${brand ?? ""}|${model ?? ""}`;
}

async function createUsers() {
  for (const c of CLIENT_USERS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: c.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: "client",
        full_name: c.full_name,
      },
    });
    if (error || !data.user) {
      throw new Error(`createUser client ${c.email}: ${error?.message ?? "no user returned"}`);
    }
    userIdByEmail.set(c.email, data.user.id);
  }

  for (const b of BUSINESS_USERS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: b.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        role: "business",
        full_name: b.full_name,
        business_name: b.business_name,
        district: b.district,
      },
    });
    if (error || !data.user) {
      throw new Error(`createUser business ${b.email}: ${error?.message ?? "no user returned"}`);
    }
    userIdByEmail.set(b.email, data.user.id);
  }

  console.log(
    `✓ created ${userIdByEmail.size} auth users (${CLIENT_USERS.length} clients + ${BUSINESS_USERS.length} businesses)`,
  );
}

async function enrichClientProfiles() {
  for (const c of CLIENT_USERS) {
    const userId = userIdByEmail.get(c.email);
    if (!userId) throw new Error(`Missing user id for ${c.email}`);

    const { error } = await admin
      .from("profiles")
      .update({
        first_name: c.first_name,
        last_name: c.last_name,
        document_type: "DNI",
        document_number: c.document_number,
        phone: c.phone,
        district: c.district,
        city: "Lima",
      })
      .eq("id", userId);

    if (error) throw new Error(`enrich client profile ${c.email}: ${error.message}`);
  }
  console.log(`✓ enriched ${CLIENT_USERS.length} client profiles`);
}

async function enrichBusinessProfiles() {
  for (const b of BUSINESS_USERS) {
    const userId = userIdByEmail.get(b.email);
    if (!userId) throw new Error(`Missing user id for ${b.email}`);

    const { error: profErr } = await admin
      .from("profiles")
      .update({
        first_name: b.first_name,
        last_name: b.last_name,
        document_type: "DNI",
        document_number: b.document_number,
        phone: b.phone,
        district: b.district,
        city: "Lima",
      })
      .eq("id", userId);

    if (profErr) throw new Error(`enrich business profile ${b.email}: ${profErr.message}`);

    const { data: biz, error: bizSelErr } = await admin
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .single<{ id: string }>();

    if (bizSelErr || !biz) {
      throw new Error(`Business row missing for ${b.email}: ${bizSelErr?.message ?? "no row"}`);
    }
    businessIdByEmail.set(b.email, biz.id);

    const extras = BUSINESS_PROFILE_EXTRAS[b.email];
    if (!extras) throw new Error(`Missing BUSINESS_PROFILE_EXTRAS for ${b.email}`);

    const { error: bizUpdErr } = await admin
      .from("businesses")
      .update({
        legal_name: b.legal_name,
        trade_name: b.business_name,
        ruc: b.ruc,
        phone: b.phone,
        district: b.district,
        address: extras.address,
        city: extras.city,
        verification_status: b.verified ? "verified" : "pending",
        verified: b.verified,
        status: "active",
      })
      .eq("id", biz.id);

    if (bizUpdErr) throw new Error(`update business ${b.email}: ${bizUpdErr.message}`);

    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: subErr } = await admin
      .from("subscriptions")
      .update({
        plan_id: b.plan_slug,
        status: "active",
        propuestas_used_this_period: 0,
        current_period_end: periodEnd,
        period_end: periodEnd,
      })
      .eq("business_id", biz.id);

    if (subErr) throw new Error(`update subscription ${b.email}: ${subErr.message}`);
  }

  console.log(`✓ enriched ${BUSINESS_USERS.length} business profiles + subscriptions`);
}

async function seedSolicitudes() {
  const rows = SOLICITUDES.map((s) => {
    const clientId = userIdByEmail.get(s.client_email);
    if (!clientId) throw new Error(`Missing client id for ${s.client_email}`);
    return {
      client_id: clientId,
      category: s.category,
      brand: s.brand,
      model: s.model,
      year: s.year,
      storage: s.storage,
      condition: s.condition,
      description: s.description,
      expected_amount_pen: s.expected_amount_pen,
      expected_term_days: s.expected_term_days,
      district: s.district,
      status: s.status,
    };
  });

  const { data, error } = await admin
    .from("solicitudes")
    .insert(rows)
    .select("id, client_id, category, brand, model");

  if (error || !data) throw new Error(`insert solicitudes: ${error?.message ?? "no rows"}`);
  if (data.length !== SOLICITUDES.length) {
    throw new Error(
      `solicitudes count mismatch: inserted ${data.length}, expected ${SOLICITUDES.length}`,
    );
  }

  // Build a reverse index: client_id → email
  const emailByUserId = new Map<string, string>();
  for (const [email, id] of userIdByEmail.entries()) emailByUserId.set(id, email);

  for (const row of data) {
    const email = emailByUserId.get(row.client_id as string);
    if (!email) throw new Error(`Cannot resolve email for client_id ${row.client_id}`);
    const key = solicitudKey(
      email,
      row.category as string,
      row.brand as string | null,
      row.model as string | null,
    );
    solicitudIdByKey.set(key, row.id as string);
  }

  console.log(`✓ seeded ${data.length} solicitudes`);
}

async function seedPropuestas() {
  const rows = PROPUESTAS.map((p) => {
    const businessId = businessIdByEmail.get(p.business_email);
    if (!businessId) throw new Error(`Missing business id for ${p.business_email}`);
    const sKey = solicitudKey(p.client_email, p.category, p.brand, p.model);
    const solicitudId = solicitudIdByKey.get(sKey);
    if (!solicitudId) throw new Error(`No solicitud match for propuesta: ${sKey}`);

    return {
      solicitud_id: solicitudId,
      business_id: businessId,
      monto_pen: p.monto_pen,
      tasa_mensual: p.tasa_mensual,
      plazo_dias: p.plazo_dias,
      status: p.status,
    };
  });

  const { data, error } = await admin
    .from("propuestas")
    .insert(rows)
    .select("id, solicitud_id, business_id");

  if (error || !data) throw new Error(`insert propuestas: ${error?.message ?? "no rows"}`);
  if (data.length !== PROPUESTAS.length) {
    throw new Error(
      `propuestas count mismatch: inserted ${data.length}, expected ${PROPUESTAS.length}`,
    );
  }

  // Index back by (client_email, business_email, category, brand, model)
  for (let i = 0; i < data.length; i++) {
    const src = PROPUESTAS[i];
    const key = propuestaKey(
      src.client_email,
      src.business_email,
      src.category,
      src.brand,
      src.model,
    );
    propuestaIdByKey.set(key, data[i].id as string);
  }

  console.log(`✓ seeded ${data.length} propuestas`);
}

async function seedOperations() {
  const inserts: Array<{
    propuesta_id: string;
    redemption_code: string;
    status: "pending_pickup" | "completed" | "disputed";
    accepted_at: string;
  }> = [];

  for (const op of OPERATIONS) {
    // Find the matching ACCEPTED propuesta. We match by (client_email, business_email, category)
    // — Task 3 ensures exactly one accepted propuesta per (client, business, category) pairing.
    const candidate = PROPUESTAS.find(
      (p) =>
        p.client_email === op.client_email &&
        p.business_email === op.business_email &&
        p.category === op.category &&
        p.status === "accepted",
    );
    if (!candidate) {
      throw new Error(
        `No accepted propuesta for operation: ${op.client_email} / ${op.business_email} / ${op.category}`,
      );
    }
    const pKey = propuestaKey(
      candidate.client_email,
      candidate.business_email,
      candidate.category,
      candidate.brand,
      candidate.model,
    );
    const propuestaId = propuestaIdByKey.get(pKey);
    if (!propuestaId) throw new Error(`Cannot resolve propuesta id for ${pKey}`);

    inserts.push({
      propuesta_id: propuestaId,
      redemption_code: op.redemption_code,
      status: op.status,
      accepted_at: op.accepted_at,
    });
  }

  const { data, error } = await admin.from("operations").insert(inserts).select("id");
  if (error || !data) throw new Error(`insert operations: ${error?.message ?? "no rows"}`);
  if (data.length !== OPERATIONS.length) {
    throw new Error(
      `operations count mismatch: inserted ${data.length}, expected ${OPERATIONS.length}`,
    );
  }

  console.log(`✓ seeded ${data.length} operations`);
}

async function main() {
  console.log("\n🌱 EMPEÑALO — Seeder (Prototype 2 Closure)\n");

  await createUsers();
  await enrichClientProfiles();
  await enrichBusinessProfiles();
  await seedSolicitudes();
  await seedPropuestas();
  await seedOperations();

  console.log("\n✅ Seed complete");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
