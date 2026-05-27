import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/db/server";
import { sanitizeError, log } from "@/lib/logger";

export type AuthRole = "client" | "business";

export type CurrentUser = {
  user: {
    id: string;
    email: string | null;
    email_confirmed_at: string | null;
  };
  profile: {
    id: string;
    role: AuthRole;
    full_name: string | null;
    phone: string | null;
    document_number: string | null;
    created_at: string;
  };
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
      .select("id, role, full_name, phone, document_number, created_at")
      .eq("id", user.id)
      .single<{
        id: string;
        role: AuthRole;
        full_name: string | null;
        phone: string | null;
        document_number: string | null;
        created_at: string;
      }>();

    if (!profile) return null;

    return {
      user: {
        id: user.id,
        email: user.email ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
      },
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

// ============================================================================
// Auth proxy functions — all auth ops go through SSR so cookies are
// first-party (empenalo.netlify.app) instead of third-party (supabase.co).
// This fixes Firefox/Safari cross-origin cookie blocking.
// ============================================================================

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const loginWithPassword = createServerFn({ method: "POST" })
  .inputValidator(loginSchema)
  .handler(async ({ data }): Promise<{ userId: string }> => {
    const supabase = getSupabaseServer();
    const { data: result, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      log.warn("login_failed", {
        email_hash: hashEmail(data.email),
        code: error.code,
        status: error.status,
      });
      if (error.code === "email_not_confirmed") {
        throw new Error("Tu correo aún no está verificado. Revisa tu bandeja de entrada.");
      }
      if (error.status === 429) {
        throw new Error("Demasiados intentos. Espera un minuto e intenta de nuevo.");
      }
      throw new Error("Correo o contraseña incorrectos.");
    }
    if (!result.user) throw new Error("No pudimos iniciar tu sesión. Intenta de nuevo.");
    return { userId: result.user.id };
  });

function hashEmail(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h.toString(16);
}

const registerClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  dni: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email_verified: z.boolean().optional(),
});

export const registerClient = createServerFn({ method: "POST" })
  .inputValidator(registerClientSchema)
  .handler(async ({ data }): Promise<{ sessionCreated: boolean }> => {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      phone: data.phone ?? undefined,
      options: {
        data: {
          role: "client",
          full_name: data.full_name,
          dni: data.dni ?? null,
          email_verified: data.email_verified ?? false,
        },
      },
    });
    if (error) throw error;

    const { data: sessionData } = await supabase.auth.getSession();
    return { sessionCreated: !!sessionData.session };
  });

const registerBusinessSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  business_name: z.string().min(1),
  district: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  ruc: z.string().optional().nullable(),
  dni_rep_legal: z.string().optional().nullable(),
  email_verified: z.boolean().optional(),
  horario: z.record(z.string(), z.any()).optional(),
});

export const registerBusiness = createServerFn({ method: "POST" })
  .inputValidator(registerBusinessSchema)
  .handler(async ({ data }): Promise<{ sessionCreated: boolean }> => {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      phone: data.phone ?? undefined,
      options: {
        data: {
          role: "business",
          full_name: data.full_name,
          business_name: data.business_name,
          district: data.district ?? null,
          ruc: data.ruc ?? null,
          dni_rep_legal: data.dni_rep_legal ?? null,
          email_verified: data.email_verified ?? false,
          horario: data.horario ?? null,
        },
      },
    });
    if (error) throw error;

    const { data: sessionData } = await supabase.auth.getSession();
    return { sessionCreated: !!sessionData.session };
  });

const sendResetSchema = z.object({ email: z.string().email(), redirectTo: z.string() });

export const sendPasswordReset = createServerFn({ method: "POST" })
  .inputValidator(sendResetSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) throw error;
    return { ok: true };
  });

const exchangeCodeSchema = z.object({ code: z.string().min(1) });

export const exchangeResetCode = createServerFn({ method: "POST" })
  .inputValidator(exchangeCodeSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(data.code);
    if (error) throw error;
    return { ok: true };
  });

const updatePasswordSchema = z.object({ password: z.string().min(8) });

export const updatePasswordServer = createServerFn({ method: "POST" })
  .inputValidator(updatePasswordSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.updateUser({ password: data.password });
    if (error) throw error;
    return { ok: true };
  });

// ============================================================================
// Email OTP verification — sends a 6-digit code to the user's email
// ============================================================================

const sendOtpSchema = z.object({ email: z.string().email() });

export const sendVerificationOtp = createServerFn({ method: "POST" })
  .inputValidator(sendOtpSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { shouldCreateUser: false },
    });
    if (error) throw error;
    return { ok: true };
  });

const verifyOtpSchema = z.object({ email: z.string().email(), token: z.string().min(6) });

export const verifyEmailOtp = createServerFn({ method: "POST" })
  .inputValidator(verifyOtpSchema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const supabase = getSupabaseServer();
    const { error } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: "email",
    });
    if (error) throw error;
    return { ok: true };
  });
