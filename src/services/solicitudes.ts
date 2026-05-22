import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/db/server";
import { buildSignedPhotoUrl } from "@/lib/photos";
import { sanitizeError, log } from "@/lib/logger";
import { rateLimitByUser } from "@/lib/rate-limit";

// ============================================================================
// Shared types
// ============================================================================
export type SolicitudStatus = "active" | "accepted" | "closed" | "expired";

export type SolicitudListItem = {
  id: string;
  category: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  storage: string | null;
  condition: string | null;
  description: string | null;
  expected_amount_pen: number | null;
  expected_term_days: number | null;
  district: string | null;
  status: SolicitudStatus;
  created_at: string;
  propuestas_count: number;
  accepted_propuesta_id: string | null;
};

export type SolicitudPhoto = {
  id: string;
  storage_path: string;
  position: number;
  signed_url: string;
};

export type SolicitudDetail = SolicitudListItem & {
  client_id: string;
  photos: SolicitudPhoto[];
};

export type SolicitudForBusiness = SolicitudListItem;

// ============================================================================
// createSolicitud — client posts a new pawn request
// ============================================================================
const createSolicitudSchema = z.object({
  category: z.string().min(1),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().int().nullable().optional(),
  storage: z.string().optional().nullable(),
  condition: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  expected_amount_pen: z.number().int().nullable().optional(),
  expected_term_days: z.number().int().nullable().optional(),
  district: z.string().optional().nullable(),
  photo_paths: z.array(z.string()).default([]),
});

export const createSolicitud = createServerFn({ method: "POST" })
  .inputValidator(createSolicitudSchema)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const rl = await rateLimitByUser("solicitud:create", user.id, 10, 3600);
    if (!rl.allowed) throw new Error("Demasiadas solicitudes. Intenta en una hora.");

    const { data: row, error } = await supabase
      .from("solicitudes")
      .insert({
        client_id: user.id,
        category: data.category,
        brand: data.brand ?? null,
        model: data.model ?? null,
        year: data.year ?? null,
        storage: data.storage ?? null,
        condition: data.condition ?? null,
        description: data.description ?? null,
        expected_amount_pen: data.expected_amount_pen ?? null,
        expected_term_days: data.expected_term_days ?? null,
        district: data.district ?? null,
      })
      .select("id")
      .single<{ id: string }>();

    if (error || !row) throw sanitizeError(error, "Error al crear la solicitud.");

    if (data.photo_paths.length > 0) {
      const photoRows = data.photo_paths.map((storage_path, position) => ({
        solicitud_id: row.id,
        storage_path,
        position,
      }));
      const { error: photoErr } = await supabase.from("solicitud_photos").insert(photoRows);
      if (photoErr) throw sanitizeError(photoErr, "Error al guardar las fotos.");
    }

    log.info("solicitud_created", { id: row.id, user_id: user.id });
    return { id: row.id };
  });

// ============================================================================
// listMySolicitudes — client dashboard
// ============================================================================
export const listMySolicitudes = createServerFn({ method: "GET" }).handler(
  async (): Promise<SolicitudListItem[]> => {
    const supabase = getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("solicitudes")
      .select(
        "id, category, brand, model, year, storage, condition, description, expected_amount_pen, expected_term_days, district, status, created_at, propuestas(count), operations(id, propuesta_id)",
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw sanitizeError(error, "Error al cargar tus solicitudes.");

    type SolicitudRow = {
      id: string;
      category: string;
      brand: string | null;
      model: string | null;
      year: number | null;
      storage: string | null;
      condition: string | null;
      description: string | null;
      expected_amount_pen: number | null;
      expected_term_days: number | null;
      district: string | null;
      status: SolicitudStatus;
      created_at: string;
      propuestas: { count: number }[] | null;
    };
    return (data ?? []).map((row: SolicitudRow) => ({
      id: row.id,
      category: row.category,
      brand: row.brand,
      model: row.model,
      year: row.year,
      storage: row.storage,
      condition: row.condition,
      description: row.description,
      expected_amount_pen: row.expected_amount_pen,
      expected_term_days: row.expected_term_days,
      district: row.district,
      status: row.status,
      created_at: row.created_at,
      propuestas_count: row.propuestas?.[0]?.count ?? 0,
      accepted_propuesta_id:
        row.status === "accepted" && row.operations?.[0]?.propuesta_id
          ? row.operations[0].propuesta_id
          : null,
    }));
  },
);

// ============================================================================
// listActiveSolicitudes — business marketplace view
// ============================================================================
const listActiveSchema = z
  .object({
    category: z.string().optional(),
    district: z.string().optional(),
    min_amount: z.number().int().optional(),
    max_amount: z.number().int().optional(),
    plazo: z.number().int().optional(),
  })
  .optional()
  .default({});

export const listActiveSolicitudes = createServerFn({ method: "GET" })
  .inputValidator(listActiveSchema)
  .handler(async ({ data: filters }): Promise<SolicitudForBusiness[]> => {
    const supabase = getSupabaseServer();

    let query = supabase
      .from("solicitudes")
      .select(
        "id, category, brand, model, condition, expected_amount_pen, expected_term_days, district, status, created_at, propuestas(count)",
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(60);

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.district) query = query.eq("district", filters.district);
    if (filters?.min_amount !== undefined)
      query = query.gte("expected_amount_pen", filters.min_amount);
    if (filters?.max_amount !== undefined)
      query = query.lte("expected_amount_pen", filters.max_amount);
    if (filters?.plazo !== undefined) query = query.eq("expected_term_days", filters.plazo);

    const { data, error } = await query;
    if (error) throw sanitizeError(error, "Error al cargar solicitudes.");

    type ActiveSolicitudRow = {
      id: string;
      category: string;
      brand: string | null;
      model: string | null;
      condition: string | null;
      expected_amount_pen: number | null;
      expected_term_days: number | null;
      district: string | null;
      status: SolicitudStatus;
      created_at: string;
      propuestas: { count: number }[] | null;
    };
    return (data ?? []).map((row: ActiveSolicitudRow) => ({
      id: row.id,
      category: row.category,
      brand: row.brand,
      model: row.model,
      year: null,
      storage: null,
      condition: row.condition,
      description: null,
      expected_amount_pen: row.expected_amount_pen,
      expected_term_days: row.expected_term_days,
      district: row.district,
      status: row.status,
      created_at: row.created_at,
      propuestas_count: row.propuestas?.[0]?.count ?? 0,
    }));
  });

// ============================================================================
// getSolicitud — full detail with photos. Single nested select (no N+1).
// ============================================================================
const getSolicitudSchema = z.object({ id: z.string().uuid() });

export const getSolicitud = createServerFn({ method: "GET" })
  .inputValidator(getSolicitudSchema)
  .handler(async ({ data }): Promise<SolicitudDetail | null> => {
    const supabase = getSupabaseServer();

    const { data: row, error } = await supabase
      .from("solicitudes")
      .select(
        "id, client_id, category, brand, model, year, storage, condition, description, expected_amount_pen, expected_term_days, district, status, created_at, solicitud_photos(id, storage_path, position), propuestas(count)",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw sanitizeError(error, "Error al cargar la solicitud.");
    if (!row) return null;

    type PhotoRow = { id: string; storage_path: string; position: number };
    type SolicitudDetailRow = {
      id: string;
      client_id: string;
      category: string;
      brand: string | null;
      model: string | null;
      year: number | null;
      storage: string | null;
      condition: string | null;
      description: string | null;
      expected_amount_pen: number | null;
      expected_term_days: number | null;
      district: string | null;
      status: SolicitudStatus;
      created_at: string;
      solicitud_photos: PhotoRow[] | null;
      propuestas: { count: number }[] | null;
    };
    const r = row as SolicitudDetailRow;
    const photosRaw: PhotoRow[] = Array.isArray(r.solicitud_photos) ? r.solicitud_photos : [];
    const photos: SolicitudPhoto[] = await Promise.all(
      photosRaw.map(async (p: PhotoRow) => ({
        id: p.id,
        storage_path: p.storage_path,
        position: p.position,
        signed_url: await buildSignedPhotoUrl(p.storage_path),
      })),
    );

    return {
      id: r.id,
      client_id: r.client_id,
      category: r.category,
      brand: r.brand,
      model: r.model,
      year: r.year,
      storage: r.storage,
      condition: r.condition,
      description: r.description,
      expected_amount_pen: r.expected_amount_pen,
      expected_term_days: r.expected_term_days,
      district: r.district,
      status: r.status,
      created_at: r.created_at,
      photos,
      propuestas_count: r.propuestas?.[0]?.count ?? 0,
    };
  });
