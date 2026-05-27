#!/usr/bin/env bun
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".dev.vars") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .dev.vars");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const EXPECTED = {
  profiles_clients_min: 8,
  profiles_businesses_min: 5,
  businesses_verified_min: 3,
  solicitudes_min: 30,
  propuestas_min: 10,
  operations_min: 3,
};

async function countByRole(role: "client" | "business") {
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", role);
  return count ?? 0;
}

async function main() {
  const clients = await countByRole("client");
  const businesses = await countByRole("business");
  const { count: verified } = await admin
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "verified");
  const { count: sol } = await admin
    .from("solicitudes")
    .select("id", { count: "exact", head: true });
  const { count: prop } = await admin
    .from("propuestas")
    .select("id", { count: "exact", head: true });
  const { count: ops } = await admin
    .from("operations")
    .select("id", { count: "exact", head: true });

  const fails: string[] = [];
  if (clients < EXPECTED.profiles_clients_min)
    fails.push(`clients=${clients} expected >= ${EXPECTED.profiles_clients_min}`);
  if (businesses < EXPECTED.profiles_businesses_min)
    fails.push(`businesses=${businesses} expected >= ${EXPECTED.profiles_businesses_min}`);
  if ((verified ?? 0) < EXPECTED.businesses_verified_min)
    fails.push(`verified=${verified} expected >= ${EXPECTED.businesses_verified_min}`);
  if ((sol ?? 0) < EXPECTED.solicitudes_min)
    fails.push(`solicitudes=${sol} expected >= ${EXPECTED.solicitudes_min}`);
  if ((prop ?? 0) < EXPECTED.propuestas_min)
    fails.push(`propuestas=${prop} expected >= ${EXPECTED.propuestas_min}`);
  if ((ops ?? 0) < EXPECTED.operations_min)
    fails.push(`operations=${ops} expected >= ${EXPECTED.operations_min}`);

  if (fails.length > 0) {
    console.error("❌ Seed verification FAILED:");
    for (const f of fails) console.error("  - " + f);
    process.exit(1);
  }
  console.log(
    `✅ Seed verification passed (clients=${clients}, businesses=${businesses}, verified=${verified}, solicitudes=${sol}, propuestas=${prop}, operations=${ops})`,
  );
}

main().catch((err) => {
  console.error("verify failed:", err);
  process.exit(2);
});
