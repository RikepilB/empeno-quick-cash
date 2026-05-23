import { createBrowserClient } from "@supabase/ssr";

let cached: ReturnType<typeof createBrowserClient> | undefined;

function parseCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined") return [];
  return document.cookie.split("; ").reduce<{ name: string; value: string }[]>((acc, cookie) => {
    const eq = cookie.indexOf("=");
    if (eq === -1) return acc;
    const name = cookie.slice(0, eq);
    const value = cookie.slice(eq + 1);
    if (name) acc.push({ name, value });
    return acc;
  }, []);
}

export function getSupabaseBrowser() {
  if (cached) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Check .env.local.",
    );
  }
  cached = createBrowserClient(url, key, {
    cookies: {
      getAll() {
        return parseCookies();
      },
      setAll(cookies) {
        if (typeof document === "undefined") return;
        for (const c of cookies) {
          let cookie = `${c.name}=${c.value}`;
          if (c.options?.maxAge) cookie += `; max-age=${c.options.maxAge}`;
          if (c.options?.domain) cookie += `; domain=${c.options.domain}`;
          if (c.options?.path) cookie += `; path=${c.options.path}`;
          if (c.options?.secure) cookie += "; secure";
          if (c.options?.sameSite) cookie += `; samesite=${c.options.sameSite}`;
          document.cookie = cookie;
        }
      },
    },
  });
  return cached;
}
