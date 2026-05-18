import { Smartphone, Laptop, Gem, Watch, Car, Box, type LucideIcon } from "lucide-react";

export type CategoryKey = "celular" | "laptop" | "joya" | "reloj" | "vehiculo" | "otro";

export const CATEGORIES: Array<{
  key: CategoryKey;
  label: string;
  emoji: string;
  icon: LucideIcon;
}> = [
  { key: "celular", label: "Celular", emoji: "📱", icon: Smartphone },
  { key: "laptop", label: "Laptop", emoji: "💻", icon: Laptop },
  { key: "joya", label: "Joya", emoji: "💍", icon: Gem },
  { key: "reloj", label: "Reloj", emoji: "⌚", icon: Watch },
  { key: "vehiculo", label: "Vehículo", emoji: "🚗", icon: Car },
  { key: "otro", label: "Otro", emoji: "📦", icon: Box },
];

const byKey = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryMeta(key: string) {
  return byKey.get(key as CategoryKey) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "hace segundos";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function formatPEN(n: number | null | undefined): string {
  if (n == null) return "S/ —";
  return `S/ ${n.toLocaleString("es-PE")}`;
}

export function buildTitle(s: {
  brand?: string | null;
  model?: string | null;
  category: string;
  storage?: string | null;
}) {
  const parts = [s.brand, s.model].filter(Boolean).join(" ").trim();
  const head = parts || categoryMeta(s.category).label;
  return s.storage ? `${head} ${s.storage}` : head;
}
