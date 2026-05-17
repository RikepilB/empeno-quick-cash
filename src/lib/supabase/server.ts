import { createServerClient } from "@supabase/ssr";
import { getCookies, setCookie } from "@tanstack/react-start/server";

// Creates a Supabase client scoped to the current SSR request.
// Reads auth cookies from the incoming request, writes Set-Cookie on auth refresh.
export function getSupabaseServer() {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY on the server.");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        const all = getCookies();
        return Object.entries(all).map(([name, value]) => ({ name, value: value ?? "" }));
      },
      setAll(cookies) {
        for (const c of cookies) {
          setCookie(c.name, c.value, c.options);
        }
      },
    },
  });
}
