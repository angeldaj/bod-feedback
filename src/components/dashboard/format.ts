import { NOW } from "@/lib/mock";

/** Tiempo relativo desde la fecha fija del panel (determinista). */
export function relativeTime(iso: string): string {
  const diff = NOW.getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 60) return `hace ${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `hace ${d} d`;
  const w = Math.round(d / 7);
  if (w < 5) return `hace ${w} sem`;
  const mo = Math.round(d / 30);
  return `hace ${mo} mes${mo > 1 ? "es" : ""}`;
}

/** Fecha larga en español para el detalle. */
export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "—";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
