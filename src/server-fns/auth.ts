import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServer } from "@/lib/supabase/server";

export type AuthRole = "client" | "business";

export type CurrentUser = {
  user: { id: string; email: string | null };
  profile: { id: string; role: AuthRole; full_name: string | null };
};

// Returns the logged-in user + their profile, or null. Called from route beforeLoad guards.
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurrentUser | null> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", user.id)
      .single<{ id: string; role: AuthRole; full_name: string | null }>();

    if (!profile) return null;

    return {
      user: { id: user.id, email: user.email ?? null },
      profile,
    };
  },
);

// Server-side sign-out: clears the Supabase auth cookies.
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServer();
  await supabase.auth.signOut();
  return { ok: true };
});
