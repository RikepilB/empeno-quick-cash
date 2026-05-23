import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/db/server";
import { sanitizeError, log } from "@/lib/logger";

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

const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  dni: z.string().optional().nullable(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(updateProfileSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const updates: Record<string, string | null> = {};
    if (data.full_name) updates.full_name = data.full_name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.dni !== undefined) updates.dni = data.dni;

    if (Object.keys(updates).length === 0) return { ok: true };

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) throw sanitizeError(error, "No se pudo actualizar el perfil.");

    log.info("profile_updated", { user_id: user.id });
    return { ok: true };
  });

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const changePassword = createServerFn({ method: "POST" })
  .inputValidator(changePasswordSchema)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: data.currentPassword,
    });
    if (signInError) throw new Error("La contraseña actual es incorrecta.");

    const { error } = await supabase.auth.updateUser({ password: data.newPassword });
    if (error) throw sanitizeError(error, "No se pudo cambiar la contraseña.");

    log.info("password_changed", { user_id: user.id });
    return { ok: true };
  });
