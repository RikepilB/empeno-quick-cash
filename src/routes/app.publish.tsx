import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/ui/PhoneFrame";
import { Camera, Plus, Loader2, X, Sparkles } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { getSupabaseBrowser } from "@/lib/db/browser";
import { createSolicitud } from "@/services/solicitudes";
import { CATEGORIES, categoryMeta, type CategoryKey } from "@/lib/categories";

export const Route = createFileRoute("/app/publish")({ component: Publish });

const CONDITIONS = ["Nuevo", "Bueno", "Regular", "Detalles"] as const;
const PLAZOS = [15, 30, 45, 60] as const;
const MIN_PHOTOS = 1;
const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const BUCKET = "solicitud-photos";

type LocalPhoto = { file: File; previewUrl: string; storagePath?: string };

function Publish() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<CategoryKey>("celular");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]>("Bueno");
  const [plazo, setPlazo] = useState<(typeof PLAZOS)[number]>(30);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [storage, setStorage] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [district, setDistrict] = useState("");

  function handleFiles(filesList: FileList | null) {
    if (!filesList || filesList.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    const incoming = Array.from(filesList)
      .filter((file) => file.size <= MAX_PHOTO_BYTES)
      .slice(0, remaining);
    if (incoming.length < Math.min(filesList.length, remaining)) {
      setError("Cada foto debe pesar 5 MB o menos.");
    } else {
      setError(null);
    }
    setPhotos((prev) => [
      ...prev,
      ...incoming.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) })),
    ]);
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx]!.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadAllPhotos(userId: string): Promise<string[]> {
    if (photos.length === 0) return [];
    const supabase = getSupabaseBrowser();
    return Promise.all(
      photos.map(async (photo, i) => {
        const ext = photo.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, photo.file, { contentType: photo.file.type || "image/jpeg" });
        if (upErr) throw new Error(`Error subiendo foto ${i + 1}: ${upErr.message}`);
        return path;
      }),
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (photos.length < MIN_PHOTOS) {
      setError(`Sube al menos ${MIN_PHOTOS} fotos.`);
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const supabase = getSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inicia sesión nuevamente.");

      const photoPaths = await uploadAllPhotos(user.id);

      const amountStr = String(form.get("expected_amount_pen") ?? "").replace(/[^\d]/g, "");
      const yearStr = String(form.get("year") ?? "").trim();
      const result = await createSolicitud({
        data: {
          category,
          brand: String(form.get("brand") ?? "").trim() || null,
          model: String(form.get("model") ?? "").trim() || null,
          year: yearStr ? Number(yearStr) : null,
          storage: String(form.get("storage") ?? "").trim() || null,
          condition,
          description: String(form.get("description") ?? "").trim() || null,
          expected_amount_pen: amountStr ? Number(amountStr) : null,
          expected_term_days: plazo,
          district: String(form.get("district") ?? "").trim() || null,
          photo_paths: photoPaths,
        },
      });
      await navigate({ to: "/app/published", search: { id: result.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setSubmitting(false);
    }
  }

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (brand) parts.push(brand);
    if (model) parts.push(model);
    if (year) parts.push(year);
    return parts.join(" · ");
  }, [brand, model, year]);

  const meta = categoryMeta(category);
  const amountNum = expectedAmount.replace(/[^\d]/g, "");

  return (
    <PhoneFrame title="Publicar artículo" back="/app/dashboard">
      <form onSubmit={onSubmit} className="md:grid md:grid-cols-[1fr_320px] md:gap-8 md:p-8">
        <div className="space-y-5 p-6 pb-10 md:p-0 md:pb-0">
          <div>
            <label className="label-field">Categoría</label>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.key;
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}
                  >
                    <Icon className="h-5 w-5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Marca</label>
              <input
                name="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="input-field"
                placeholder="Apple"
              />
            </div>
            <div>
              <label className="label-field">Modelo</label>
              <input
                name="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field"
                placeholder="iPhone 14 Pro"
              />
            </div>
            <div>
              <label className="label-field">Año de compra</label>
              <input
                name="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                type="number"
                inputMode="numeric"
                className="input-field"
                placeholder="2023"
              />
            </div>
            <div>
              <label className="label-field">Almacenamiento</label>
              <input
                name="storage"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="input-field"
                placeholder="256 GB"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Estado del artículo</label>
            <div className="grid grid-cols-4 gap-2">
              {CONDITIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setCondition(e)}
                  className={`rounded-lg border px-2 py-2 text-xs ${condition === e ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Descripción / imperfecciones</label>
            <textarea
              name="description"
              className="input-field min-h-[70px]"
              placeholder="Cuéntale a la casa de empeño el estado real del artículo."
            />
          </div>

          <div>
            <label className="label-field">
              Fotografías (mín. {MIN_PHOTOS} · máx. {MAX_PHOTOS})
            </label>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
              {photos.map((p, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-lg bg-surface-2"
                >
                  <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                    aria-label="Quitar foto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Camera className="h-5 w-5" />
                  <span className="mt-1 text-[10px]">Agregar</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <details className="group rounded-xl border border-border bg-surface" open>
            <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium">
              Opciones avanzadas
              <Plus className="h-4 w-4 transition group-open:rotate-45" />
            </summary>
            <div className="space-y-4 border-t border-border p-4">
              <div>
                <label className="label-field">Monto esperado (S/)</label>
                <input
                  name="expected_amount_pen"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  inputMode="numeric"
                  className="input-field"
                  placeholder="2,500"
                />
              </div>
              <div>
                <label className="label-field">Plazo deseado</label>
                <div className="grid grid-cols-4 gap-2">
                  {PLAZOS.map((d) => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setPlazo(d)}
                      className={`rounded-lg border py-2 text-xs ${plazo === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                    >
                      {d} días
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-field">Distrito</label>
                <input
                  name="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="input-field"
                  placeholder="Miraflores"
                />
              </div>
            </div>
          </details>

          {error && (
            <div className="rounded-lg bg-status-reported/15 px-3 py-2 text-xs text-status-reported">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60 md:hidden"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Publicando..." : "Publicar y esperar propuestas"}
          </button>
        </div>

        <aside className="hidden md:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Resumen
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-2xl">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase text-muted-foreground">{meta.label}</div>
                  <div className="truncate font-display text-base font-bold">
                    {summary || "Sin datos aún"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Estado: {condition}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <Row k="Plazo" v={`${plazo} días`} />
                <Row
                  k="Monto esperado"
                  v={amountNum ? `S/ ${Number(amountNum).toLocaleString("es-PE")}` : "—"}
                />
                <Row k="Distrito" v={district || "—"} />
                <Row k="Fotos" v={`${photos.length} / ${MAX_PHOTOS}`} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">Antes de publicar</div>
              <ul className="mt-2 space-y-1.5">
                <li>
                  · Mínimo {MIN_PHOTOS} foto · máximo {MAX_PHOTOS}
                </li>
                <li>· 5 MB por archivo</li>
                <li>· Fotos claras = mejores ofertas</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Publicando..." : "Publicar y esperar propuestas"}
            </button>
          </div>
        </aside>
      </form>
    </PhoneFrame>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold">{v}</span>
    </div>
  );
}
