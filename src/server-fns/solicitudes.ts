import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

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
};

export type SolicitudPhoto = {
  id: string;
  storage_path: string;
  position: number;
  public_url: string;
};

export type SolicitudDetail = SolicitudListItem & {
  client_id: string;
  photos: SolicitudPhoto[];
};

// Solicitud row + business name, for business marketplace view
export type SolicitudForBusiness = SolicitudListItem;

// ============================================================================
// Helpers
// ============================================================================
const STORAGE_BUCKET = "solicitud-photos";

function buildPublicPhotoUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}

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

    if (error || !row) throw new Error(error?.message ?? "Error al crear solicitud");

    if (data.photo_paths.length > 0) {
      const photoRows = data.photo_paths.map((storage_path, position) => ({
        solicitud_id: row.id,
        storage_path,
        position,
      }));
      const { error: photoErr } = await supabase.from("solicitud_photos").insert(photoRows);
      if (photoErr) throw new Error(photoErr.message);
    }

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
        "id, category, brand, model, year, storage, condition, description, expected_amount_pen, expected_term_days, district, status, created_at, propuestas(count)",
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
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
    }));
  },
);

// ============================================================================
// listActiveSolicitudes — business marketplace view (requires active sub via RLS)
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
        "id, category, brand, model, year, storage, condition, description, expected_amount_pen, expected_term_days, district, status, created_at, propuestas(count)",
      )
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(60);

    if (filters?.category) query = query.eq("category", filters.category);
    if (filters?.district) query = query.eq("district", filters.district);
    if (filters?.min_amount !== undefined) query = query.gte("expected_amount_pen", filters.min_amount);
    if (filters?.max_amount !== undefined) query = query.lte("expected_amount_pen", filters.max_amount);
    if (filters?.plazo !== undefined) query = query.eq("expected_term_days", filters.plazo);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
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
    }));
  });

// ============================================================================
// getSolicitud — full detail with photos. Used by both client and business.
// ============================================================================
const getSolicitudSchema = z.object({ id: z.string().uuid() });

export const getSolicitud = createServerFn({ method: "GET" })
  .inputValidator(getSolicitudSchema)
  .handler(async ({ data }): Promise<SolicitudDetail | null> => {
    const supabase = getSupabaseServer();
    const supabaseUrl = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;

    const { data: row, error } = await supabase
      .from("solicitudes")
      .select(
        "id, client_id, category, brand, model, year, storage, condition, description, expected_amount_pen, expected_term_days, district, status, created_at",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return null;

    const { data: photos, error: photosErr } = await supabase
      .from("solicitud_photos")
      .select("id, storage_path, position")
      .eq("solicitud_id", data.id)
      .order("position", { ascending: true });

    if (photosErr) throw new Error(photosErr.message);

    const { count: propuestaCount } = await supabase
      .from("propuestas")
      .select("id", { count: "exact", head: true })
      .eq("solicitud_id", data.id);

    return {
      ...row,
      photos: (photos ?? []).map((p) => ({
        id: p.id,
        storage_path: p.storage_path,
        position: p.position,
        public_url: buildPublicPhotoUrl(supabaseUrl, p.storage_path),
      })),
      propuestas_count: propuestaCount ?? 0,
    } as SolicitudDetail;
  });
