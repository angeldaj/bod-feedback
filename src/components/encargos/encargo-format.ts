import type { CartItem } from "@/components/pedidos/use-cart";
import type { EncargoStatus } from "@/lib/encargos-api";

/** La fecha deseada debe estar al menos a este plazo (igual que el backend). */
export const MIN_LEAD_HOURS = 24;
export const MAX_AHEAD_DAYS = 60;
export const MAX_NOTE_LENGTH = 500;
/** Sin productos, la nota debe describir el encargo con al menos esto. */
export const MIN_NOTE_WITHOUT_ITEMS = 10;

const HOUR_MS = 60 * 60 * 1000;
const caracasDay = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" });

/** Día y hora de Caracas a ISO. Venezuela no cambia de horario: el desfase fijo es exacto. */
export function caracasToIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const value = new Date(`${date}T${time}:00-04:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

/** Límites del selector de fecha, como días de Caracas `YYYY-MM-DD`. */
export function dateBounds(now = new Date()): { min: string; max: string } {
  return {
    min: caracasDay.format(new Date(now.getTime() + MIN_LEAD_HOURS * HOUR_MS)),
    max: caracasDay.format(new Date(now.getTime() + MAX_AHEAD_DAYS * 24 * HOUR_MS)),
  };
}

/** Error de la fecha y hora elegidas, o null si sirven. */
export function whenError(date: string, time: string, now = new Date()): string | null {
  if (!date) return "Elige el día que lo necesitas.";
  if (!time) return "Elige la hora.";
  const iso = caracasToIso(date, time);
  if (!iso) return "Revisa la fecha y la hora.";
  const at = new Date(iso).getTime();
  if (at < now.getTime() + MIN_LEAD_HOURS * HOUR_MS) {
    return `Los encargos se piden con al menos ${MIN_LEAD_HOURS} horas de anticipación. Elige una hora posterior.`;
  }
  if (at > now.getTime() + MAX_AHEAD_DAYS * 24 * HOUR_MS) {
    return `Recibimos encargos hasta con ${MAX_AHEAD_DAYS} días de anticipación.`;
  }
  return null;
}

const whenFormat = new Intl.DateTimeFormat("es-VE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Caracas",
});

export function formatWhen(iso: string): string {
  return whenFormat.format(new Date(iso));
}

export const STATUS_LABELS: Record<EncargoStatus, string> = {
  requested: "Recibido, por cotizar",
  quoted: "Cotización lista",
  accepted: "Verificando tu abono",
  confirmed: "Confirmado",
  preparing: "En preparación",
  ready: "Listo",
  delivered: "Entregado",
  rejected: "Rechazaste la cotización",
  expired: "La cotización venció",
  cancelled: "Cancelado",
};

export function statusLabel(status: EncargoStatus, mode: "delivery" | "pickup"): string {
  if (status === "ready") return mode === "pickup" ? "Listo para retirar" : "En camino";
  return STATUS_LABELS[status];
}

export type EncargoSummary = {
  code: string;
  trackingUrl: string;
  name: string;
  phone: string;
  mode: "delivery" | "retiro";
  zoneName?: string;
  address?: string;
  storeName: string;
  when: string;
  note: string;
  items: CartItem[];
};

/** Mensaje de WhatsApp al local con el encargo y su link de seguimiento. */
export function buildEncargoWhatsappMessage(order: EncargoSummary): string {
  const lines = [
    `*Nuevo encargo ${order.code} — La Bodega*`,
    `Cliente: ${order.name} · ${order.phone}`,
    `Para: ${formatWhen(order.when)}`,
    order.mode === "delivery"
      ? `Modalidad: Delivery — Zona: ${order.zoneName ?? ""}\nDirección: ${order.address ?? ""}`
      : `Modalidad: Retiro en local — ${order.storeName}`,
  ];
  if (order.items.length > 0) {
    lines.push("", "*Productos*");
    for (const item of order.items) {
      lines.push(`${item.quantity} × ${item.name}`);
      if (item.note.trim()) lines.push(`   Nota: ${item.note.trim()}`);
    }
  }
  if (order.note.trim()) lines.push("", `*Lo que necesito:* ${order.note.trim()}`);
  lines.push("", `Seguimiento: ${order.trackingUrl}`);
  return lines.join("\n");
}

// ─── Encargos recientes en este teléfono ─────────────────────────────────

const RECENT_KEY = "labodega-encargos";
const MAX_RECENT = 5;

export type RecentEncargo = { code: string; token: string; when: string };

export function readRecentEncargos(): RecentEncargo[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentEncargo[]) : [];
  } catch {
    return [];
  }
}

export function rememberEncargo(entry: RecentEncargo) {
  try {
    const next = [entry, ...readRecentEncargos().filter((e) => e.token !== entry.token)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Recordarlo es opcional: el link también va en el WhatsApp.
  }
}
