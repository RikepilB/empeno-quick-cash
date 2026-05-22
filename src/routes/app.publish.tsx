import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { ClientLayout } from "@/ui/ClientLayout";
import { Camera, Plus, Loader2, X, Sparkles } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/db/browser";
import { createSolicitud, updateSolicitud, getSolicitud } from "@/services/solicitudes";
import { CATEGORIES, categoryMeta, type CategoryKey } from "@/lib/categories";
import { CategoryFields } from "@/ui/CategoryFields";
import { z } from "zod";

const editSearchSchema = z.object({ edit: z.string().uuid().optional() });
export const Route = createFileRoute("/app/publish")({
  component: Publish,
  validateSearch: editSearchSchema,
});

const CONDITIONS = ["Nuevo", "Bueno", "Regular", "Detalles"] as const;
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
  const [plazo, setPlazo] = useState<number | "custom">(30);
  const [customPlazoDays, setCustomPlazoDays] = useState<number | undefined>(undefined);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [storage, setStorage] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");

  const search = useSearch({ from: "/app/publish" });
  const editId = search.edit;
  const isEditing = !!editId;

  useEffect(() => {
    if (!editId) return;
    setSubmitting(true);
    getSolicitud({ data: { id: editId } })
      .then((s) => {
        if (!s) return;
        setCategory(s.category as CategoryKey);
        setBrand(s.brand ?? "");
        setModel(s.model ?? "");
        setYear(s.year ? String(s.year) : "");
        setStorage(s.storage ?? "");
        setCondition((s.condition as (typeof CONDITIONS)[number]) ?? "Bueno");
        setDescription(s.description ?? "");
        setExpectedAmount(s.expected_amount_pen ? String(s.expected_amount_pen) : "");
        setPlazo(s.expected_term_days ?? 30);
        setDistrict(s.district ?? "");
      })
      .catch(() => setError("No se pudo cargar la publicación."))
      .finally(() => setSubmitting(false));
  }, [editId]);

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
    if (isEditing) {
      if (photos.length < MIN_PHOTOS) {
        setError(`Sube al menos ${MIN_PHOTOS} foto para editar.`);
        return;
      }
    } else {
      if (photos.length < MIN_PHOTOS) {
        setError(`Sube al menos ${MIN_PHOTOS} foto.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const form = new FormData(e.currentTarget);
      const supabase = getSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Inicia sesión nuevamente.");

      let photoPaths: string[] = [];
      if (!isEditing) {
        photoPaths = await uploadAllPhotos(user.id);
      }

      const amountStr = String(form.get("expected_amount_pen") ?? "").replace(/[^\d]/g, "");
      const yearStr = String(form.get("year") ?? "").trim();

      if (isEditing && editId) {
        await updateSolicitud({
          data: {
            id: editId,
            brand: String(form.get("brand") ?? "").trim() || null,
            model: String(form.get("model") ?? "").trim() || null,
            year: yearStr ? Number(yearStr) : null,
            storage: String(form.get("storage") ?? "").trim() || null,
            condition,
            description: String(form.get("description") ?? "").trim() || null,
            expected_amount_pen: amountStr ? Number(amountStr) : null,
            expected_term_days: plazo === "custom" ? (customPlazoDays ?? 30) : plazo,
            district: String(form.get("district") ?? "").trim() || null,
          },
        });
        await navigate({ to: "/app/mis-articulos" });
      } else {
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
            expected_term_days: plazo === "custom" ? (customPlazoDays ?? 30) : plazo,
            district: String(form.get("district") ?? "").trim() || null,
            photo_paths: photoPaths,
          },
        });
        await navigate({ to: "/app/published", search: { id: result.id } });
      }
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
    <ClientLayout
      title={isEditing ? "Editar publicación" : "Publicar artículo"}
      subtitle="Completa los datos de tu artículo"
    >
      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="label-field">Categoría</label>
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = category === c.key;
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => setCategory(c.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}
                  >
                    <Icon className="h-5 w-5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <CategoryFields category={category} />

          {/* Condition */}
          <div>
            <label className="label-field">Estado del artículo</label>
            <div className="grid grid-cols-4 gap-2">
              {CONDITIONS.map((e) => (
                <button
                  type="button"
                  key={e}
                  onClick={() => setCondition(e)}
                  className={`rounded-lg border px-3 py-2.5 text-sm ${condition === e ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label-field">Detalles adicionales (opcional)</label>
            <textarea
              name="description"
              className="input-field min-h-[80px]"
              placeholder="Cuéntale a la casa de empeño el estado real del artículo."
            />
          </div>

          {/* Photos */}
          <div>
            <label className="label-field">
              Fotografías (mín. {MIN_PHOTOS} · máx. {MAX_PHOTOS})
            </label>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {photos.map((p, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-xl bg-surface-2"
                >
                  <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1.5 text-white"
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
                  className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <Camera className="h-6 w-6" />
                  <span className="mt-1.5 text-xs">Agregar</span>
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

          {/* Loan conditions */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 font-display text-lg font-bold uppercase">
              Condiciones del préstamo
            </div>
            <div className="grid gap-5 md:grid-cols-2">
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
                <label className="label-field">Distrito</label>
                <input
                  name="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="input-field"
                  placeholder="Miraflores"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label-field">Plazo deseado</label>
                <div className="grid grid-cols-5 gap-2">
                  {([15, 30, 45, 60, "custom"] as const).map((d) => (
                    <button
                      type="button"
                      key={String(d)}
                      onClick={() => setPlazo(d)}
                      className={`rounded-lg border py-2.5 text-sm ${plazo === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                    >
                      {d === "custom" ? "Otros…" : `${d} días`}
                    </button>
                  ))}
                </div>
                {plazo === "custom" && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customPlazoDays ?? ""}
                      onChange={(e) => setCustomPlazoDays(Number(e.target.value))}
                      className="input-field max-w-[160px]"
                      placeholder="Días exactos"
                    />
                    <span className="text-sm text-muted-foreground">días</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-status-reported/15 px-4 py-3 text-sm text-status-reported">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-base disabled:opacity-60"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitting ? "Publicando..." : "Publicar y esperar propuestas"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Las ofertas de casa de empeño están sujetas a previa evaluación física.
          </p>
        </div>

        {/* Sidebar summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Resumen
              </div>
              <div className="mt-4 flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-2 text-3xl">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] uppercase text-muted-foreground">{meta.label}</div>
                  <div className="truncate font-display text-lg font-bold">
                    {summary || "Sin datos aún"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Estado: {condition}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
                <Row
                  k="Plazo"
                  v={plazo === "custom" ? `${customPlazoDays ?? "—"} días` : `${plazo} días`}
                />
                <Row
                  k="Monto esperado"
                  v={amountNum ? `S/ ${Number(amountNum).toLocaleString("es-PE")}` : "—"}
                />
                <Row k="Distrito" v={district || "—"} />
                <Row k="Fotos" v={`${photos.length} / ${MAX_PHOTOS}`} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="font-semibold text-foreground">Antes de publicar</div>
              <ul className="mt-2.5 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>·</span> Mínimo {MIN_PHOTOS} foto · máximo {MAX_PHOTOS}
                </li>
                <li className="flex items-start gap-2">
                  <span>·</span> 5 MB por archivo máximo
                </li>
                <li className="flex items-start gap-2">
                  <span>·</span> Fotos claras = mejores ofertas
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </form>
    </ClientLayout>
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
