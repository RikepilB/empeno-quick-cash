import { createClient } from "@supabase/supabase-js";

// Service-role client for trusted server contexts only:
//   - Culqi webhook handlers (bumping subscription state)
//   - Backfill / admin scripts
// Never import this from any module that the browser bundle could include.
let cached: ReturnType<typeof createClient> | undefined;

export function getSupabaseAdmin() {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add to .dev.vars locally, and `wrangler secret put SUPABASE_SERVICE_ROLE_KEY` for production.",
    );
  }
  cached = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
