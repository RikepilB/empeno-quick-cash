#!/usr/bin/env bun
// scripts/seed-reset.ts
// DESTRUCTIVE: truncates all user-data tables, purges solicitud-photos bucket,
// and deletes auth.users rows except those flagged app_metadata.seed_protected = true.
// Intended for non-production runs only.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

// FK-ordered: leaf tables first, root tables last
const TABLES_IN_FK_ORDER = [
  "commissions",
  "featured_offers",
  "payments",
  "invoices",
  "operations",
  "propuestas",
  "solicitud_photos",
  "solicitudes",
  "subscriptions",
  "audit_logs",
  "business_members",
  "businesses",
  "profiles",
];

// Per-table delete filter: tables without a uuid `id` column need a different anchor.
// - business_members: composite PK (business_id, user_id), no `id` column
// - audit_logs: id is bigserial, not uuid
const DELETE_FILTERS: Record<string, { column: string; value: string | number }> = {
  business_members: { column: "business_id", value: "00000000-0000-0000-0000-000000000000" },
  audit_logs: { column: "id", value: 0 },
};
const DEFAULT_FILTER = { column: "id", value: "00000000-0000-0000-0000-000000000000" };

async function main() {
  const projectRef = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const confirm = process.env.SEED_RESET_CONFIRM;
  if (!projectRef) {
    console.error("Could not parse Supabase project ref from SUPABASE_URL — refusing to run.");
    process.exit(1);
  }
  if (confirm !== projectRef) {
    console.error(
      `Refusing to wipe project '${projectRef}'.\n` +
        `Set SEED_RESET_CONFIRM=${projectRef} to confirm.`,
    );
    process.exit(1);
  }
  console.log(`✓ confirmed target project ref: ${projectRef}`);

  for (const table of TABLES_IN_FK_ORDER) {
    const { column, value } = DELETE_FILTERS[table] ?? DEFAULT_FILTER;
    const { error } = await admin.from(table).delete().neq(column, value);
    if (error) {
      console.error(`Failed truncate ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(`✓ truncated ${table}`);
  }

  // Storage: photos are organized as {solicitud-id}/{photo-id}.jpg — list returns folders
  // at root, so recurse one level to remove files inside each folder.
  const { data: folders } = await admin.storage.from("solicitud-photos").list("", { limit: 1000 });
  let removedCount = 0;
  for (const folder of folders ?? []) {
    const { data: files } = await admin.storage
      .from("solicitud-photos")
      .list(folder.name, { limit: 1000 });
    if (!files || files.length === 0) continue;
    const paths = files.map((f) => `${folder.name}/${f.name}`);
    const { error } = await admin.storage.from("solicitud-photos").remove(paths);
    if (error) console.error(`storage remove warning (${folder.name}): ${error.message}`);
    else removedCount += paths.length;
  }
  console.log(`✓ removed ${removedCount} storage objects`);

  // Delete all auth users (cliente + negocio). Preserve admin/seed accounts marked with
  // app_metadata.seed_protected = true.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of list?.users ?? []) {
    if (u.app_metadata?.seed_protected === true) continue;
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error(`auth delete ${u.id} warning: ${error.message}`);
  }
  console.log(`✓ purged auth.users (preserved seed_protected accounts)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
