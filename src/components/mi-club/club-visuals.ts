import {
  CakeSlice,
  Citrus,
  Coffee,
  Croissant,
  EggFried,
  Gift,
  Sparkles,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { CardSkin, ClubCard, Voucher } from "@/lib/club-api";

/** Nombre visible de cada piel (el enum vive en el contrato). */
export const SKIN_NAME: Record<CardSkin, string> = {
  cobre: "Cobre",
  plata: "Plata",
  oro: "Oro",
  rose: "Rosé",
  obsidiana: "Obsidiana",
  perla: "Perla",
  prisma: "Prisma",
};

export const textureUrl = (designId: string) => `/club/texturas/${designId}.webp`;

export type Tone = "gold" | "coral" | "cocoa" | "cream";

const CATEGORY: Record<string, { icon: LucideIcon; tone: Tone }> = {
  Desayuno: { icon: Coffee, tone: "gold" },
  Bebidas: { icon: Citrus, tone: "coral" },
  Panadería: { icon: Croissant, tone: "cream" },
  Postres: { icon: CakeSlice, tone: "cream" },
  Almuerzo: { icon: UtensilsCrossed, tone: "coral" },
  Delivery: { icon: Truck, tone: "cocoa" },
};

export function categoryIcon(category: string | null | undefined): LucideIcon {
  return (category && CATEGORY[category]?.icon) || Gift;
}

export function categoryTone(category: string | null | undefined): Tone {
  return (category && CATEGORY[category]?.tone) || "gold";
}

/** Ícono de una recompensa por nombre cuando la categoría es ambigua. */
export function rewardIcon(name: string, category: string): LucideIcon {
  if (/desayuno criollo/i.test(name)) return EggFried;
  return categoryIcon(category);
}

export const voucherIcon = (v: Voucher): LucideIcon =>
  v.grantReason === "tier_up" && !v.category ? Sparkles : categoryIcon(v.category);

/** Clase de color del voucher: canje dorado, regalo papel, compensación coral. */
export function voucherKindClass(v: Voucher): string {
  if (v.origin === "redemption") return "k-canje";
  return v.grantReason === "complaint" ? "k-queja" : "k-regalo";
}

export const ORIGIN_LABEL = (v: Voucher) => (v.origin === "redemption" ? "Canje con puntos" : "Regalo de la casa");

export const fmtPts = (n: number) => n.toLocaleString("es-VE");
export const money = (n: number) => `$${n.toFixed(2).replace(".", ",")}`;

const HOUR = 3_600_000;
export function expiryLabel(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (Number.isNaN(ms)) return "";
  if (ms <= 0) return "Vencido";
  const h = Math.floor(ms / HOUR);
  const m = Math.floor((ms % HOUR) / 60_000);
  if (h >= 48) {
    return `Vence el ${new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "short" })}`;
  }
  return `Vence en ${h} h ${m} min`;
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "short" });

export function monthLabel(iso: string): string {
  const d = new Date(iso);
  const label = d.toLocaleDateString("es-VE", { month: "long", year: "numeric" }).replace(" de ", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function isToday(iso: string, now = new Date()): boolean {
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/** Color de los módulos del QR sobre el fondo claro de cada piel. */
export const SKIN_QR: Record<CardSkin, string> = {
  cobre: "#2b1206",
  plata: "#1b2026",
  oro: "#2a1608",
  rose: "#381310",
  obsidiana: "#16110c",
  perla: "#2c2318",
  prisma: "#221a31",
};

/** Datos de la cara de la tarjeta a partir de la tarjeta del backend. */
export function toFace(
  card: ClubCard,
  over: Partial<{ designId: string; skin: CardSkin; tierName: string }> = {},
) {
  return {
    holderName: card.holderName,
    memberNo: card.memberNo,
    qrValue: card.qrValue,
    balance: card.balance,
    tierName: over.tierName ?? card.tier.name,
    skin: over.skin ?? card.tier.skin,
    designId: over.designId ?? card.designId,
  };
}
