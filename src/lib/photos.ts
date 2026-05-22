import { getSupabaseAdmin } from "@/lib/db/admin";

const STORAGE_BUCKET = "solicitud-photos";

let _supabaseUrl = "";
function getSupabaseUrl(): string {
  if (!_supabaseUrl) {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    _supabaseUrl = process.env.SUPABASE_URL ?? env?.VITE_SUPABASE_URL ?? "";
  }
  return _supabaseUrl;
}

export async function buildSignedPhotoUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("[signedUrl] failed for", storagePath, error?.message);
    return `${getSupabaseUrl()}/storage/v1/object/sign/${STORAGE_BUCKET}/${storagePath}`;
  }
  return data.signedUrl;
}

export function buildPublicPhotoUrl(storagePath: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
}
