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

// Belt + suspenders: refuse to reset against URLs that don't look like dev/test.
const ALLOWED_HOST_PATTERNS = [/raoprigiowskqnylapqs/, /localhost/, /127\.0\.0\.1/];
const safe = ALLOWED_HOST_PATTERNS.some((re) => re.test(url));
if (!safe && process.env.SEED_ALLOW_DESTRUCTIVE !== "1") {
  console.error(
    `Refusing to reset against ${url} — not in allowlist. Set SEED_ALLOW_DESTRUCTIVE=1 to override.`,
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("\n♻️  EMPEÑALO — Seed Reset\n");
  console.log(`Target: ${url}`);

  const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const targets = (list?.users ?? []).filter(
    (u) =>
      u.email?.startsWith("demo.") ||
      u.email === "cliente.test@empenalo.local" ||
      u.email === "negocio.test@empenalo.local",
  );

  if (targets.length === 0) {
    console.log("  Nothing to clean");
    return;
  }

  // Clear ON DELETE RESTRICT money rows before cascading user delete.
  const { data: bizRows } = await supabase
    .from("businesses")
    .select("id")
    .in(
      "owner_id",
      targets.map((u) => u.id),
    );
  const bizIds = (bizRows ?? []).map((b) => b.id);

  if (bizIds.length > 0) {
    await supabase.from("commissions").delete().in("business_id", bizIds);
    await supabase.from("featured_offers").delete().in("business_id", bizIds);
    await supabase.from("payments").delete().in("business_id", bizIds);
  }

  let deleted = 0;
  for (const u of targets) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.log(`  ! delete ${u.email}: ${error.message}`);
    else deleted++;
  }

  console.log(`\n  Deleted ${deleted}/${targets.length} demo/test users`);
  console.log("\n✅ Reset complete. Run `bun run scripts/seed.ts` to reseed.\n");
}

main().catch((err) => {
  console.error("reset failed:", err);
  process.exit(1);
});
