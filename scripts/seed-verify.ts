import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

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

let failures = 0;

function check(label: string, cond: boolean, detail?: string) {
  const mark = cond ? "✓" : "✗";
  console.log(`  ${mark} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
}

async function main() {
  console.log("\n🔍 EMPEÑALO — Seed Verification\n");

  // Auth users
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
  const demoUsers = (users?.users ?? []).filter(
    (u) =>
      u.email?.startsWith("demo.") ||
      u.email === "cliente.test@empenalo.local" ||
      u.email === "negocio.test@empenalo.local",
  );
  check("Auth users present", demoUsers.length >= 12, `${demoUsers.length} demo users`);

  // Profiles
  const { data: profiles } = await supabase.from("profiles").select("id, document_number").in(
    "id",
    demoUsers.map((u) => u.id),
  );
  check("Profiles match users", (profiles?.length ?? 0) === demoUsers.length, `${profiles?.length}/${demoUsers.length}`);

  // Businesses verified
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, verification_status, status, ruc, district")
    .in(
      "owner_id",
      demoUsers.map((u) => u.id),
    );
  const verified = (businesses ?? []).filter((b) => b.verification_status === "verified");
  check("Businesses verified", verified.length >= 6, `${verified.length} verified`);
  check("Businesses RUC populated", (businesses ?? []).every((b) => b.ruc?.length === 11));

  // Subscriptions
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("plan_id, status")
    .in(
      "business_id",
      (businesses ?? []).map((b) => b.id),
    );
  const activeSubs = (subs ?? []).filter((s) => s.status === "active");
  check("Active subscriptions per business", activeSubs.length === (businesses?.length ?? 0));
  const planSet = new Set((subs ?? []).map((s) => s.plan_id));
  check("Plan tier spread", planSet.size >= 3, [...planSet].join(", "));

  // Solicitudes
  const { data: solicitudes } = await supabase
    .from("solicitudes")
    .select("id, category")
    .in(
      "client_id",
      demoUsers.filter((u) => !u.email?.includes("negocio.")).map((u) => u.id),
    );
  check("Solicitudes ≥ 30", (solicitudes?.length ?? 0) >= 30, `${solicitudes?.length}`);
  const catSet = new Set((solicitudes ?? []).map((s) => s.category));
  check("≥ 11 categorías present", catSet.size >= 11, [...catSet].sort().join(", "));

  // Propuestas
  const { data: propuestas } = await supabase
    .from("propuestas")
    .select("id, solicitud_id, status")
    .in(
      "solicitud_id",
      (solicitudes ?? []).map((s) => s.id),
    );
  check("Propuestas seeded", (propuestas?.length ?? 0) >= 30, `${propuestas?.length}`);

  // Operations
  const { data: operations } = await supabase
    .from("operations")
    .select("id, status, redemption_code")
    .in(
      "propuesta_id",
      (propuestas ?? []).map((p) => p.id),
    );
  check("Operations seeded", (operations?.length ?? 0) >= 5);
  const codeRe = /^EMP-[A-Z0-9]{4,6}$/;
  check(
    "Redemption codes valid",
    (operations ?? []).every((o) => codeRe.test(o.redemption_code)),
  );

  // Completed + disputed mix
  const completed = (operations ?? []).filter((o) => o.status === "completed");
  const disputed = (operations ?? []).filter((o) => o.status === "disputed");
  check("Some operations completed", completed.length >= 1, `${completed.length}`);
  check("Disputed operation exists", disputed.length >= 1, `${disputed.length}`);

  // Featured offers (post-0006)
  const { data: featured, error: featErr } = await supabase
    .from("featured_offers")
    .select("id, propuesta_id, source")
    .in(
      "propuesta_id",
      (propuestas ?? []).map((p) => p.id),
    );
  if (featErr) {
    console.log(`  (featured_offers check skipped: ${featErr.message})`);
  } else {
    check("Featured offers seeded", (featured?.length ?? 0) >= 1, `${featured?.length}`);
  }

  // Commissions (post-0006; written automatically by accept_propuesta)
  const { data: commissions, error: commErr } = await supabase
    .from("commissions")
    .select("id, status");
  if (commErr) {
    console.log(`  (commissions check skipped: ${commErr.message})`);
  } else {
    check("Commissions ledger populated", (commissions?.length ?? 0) >= 1, `${commissions?.length}`);
  }

  console.log(`\n${failures === 0 ? "✅" : "❌"} ${failures} failures\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("verify failed:", err);
  process.exit(2);
});
