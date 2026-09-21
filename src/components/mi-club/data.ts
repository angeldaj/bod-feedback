import {
  CakeSlice,
  Coffee,
  Croissant,
  Gift,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/**
 * Tipos, etiquetas e íconos compartidos del panel /mi-club. Los datos ya NO
 * viven aquí: vienen del backend real vía `src/lib/loyalty-api.ts` y
 * `src/components/mi-club/use-member-data.ts`. Este archivo solo define
 * formas y mapea categoría → ícono/imagen, para que la UI no dependa de
 * nombres de recompensa hardcodeados.
 */

export type Reward = {
  id: string;
  name: string;
  points: number;
  category: string;
  note: string;
  image: string;
  active: boolean;
  /** Alcanzable con el saldo actual del socio. */
  affordable: boolean;
};

/** Ícono por categoría de recompensa (curado, no depende del nombre exacto). */
export const REWARD_CATEGORY_ICON: Record<string, LucideIcon> = {
  Bebidas: Coffee,
  Panadería: Croissant,
  Dulce: CakeSlice,
  Menú: UtensilsCrossed,
  Postres: CakeSlice,
  Especial: Gift,
  Experiencia: Sparkles,
};

export const DEFAULT_REWARD_ICON: LucideIcon = Gift;

/** Imagen curada por categoría (el backend puede no traer `imageUrl`). */
export const REWARD_CATEGORY_IMAGE: Record<string, string> = {
  Bebidas: "1509440159596-0249088772ff",
  Panadería: "1549931319-a545dcf3bc73",
  Dulce: "1551024506-0bccd828d307",
  Menú: "1533089860892-a7c6f0a88666",
  Postres: "1504754524776-8f4f37790ca0",
  Especial: "1578985545062-69928b1d9587",
  Experiencia: "1414235077428-338989a2e8c0",
};

export const DEFAULT_REWARD_IMAGE = "1509440159596-0249088772ff";

/** Resuelve una imagen de recompensa: usa la del backend si es utilizable por
 * el componente `Photo` (id de Unsplash o ruta absoluta); si no, cae a la
 * imagen curada por categoría. */
export function resolveRewardImage(reward: Pick<Reward, "image" | "category">): string {
  if (reward.image && (reward.image.startsWith("/") || !reward.image.includes("://"))) {
    return reward.image;
  }
  return REWARD_CATEGORY_IMAGE[reward.category] ?? DEFAULT_REWARD_IMAGE;
}

export type PointsPoint = { month: string; earned: number };

export type Purchase = {
  dateLabel: string;
  date: string;
  branch: string;
  channel: "Mesa" | "Para llevar" | "Delivery" | "Panadería";
  summary: string;
  amount: number;
  points: number;
};

export type ClubEvent = {
  kind: "descuento" | "evento" | "cumple";
  tag: string;
  title: string;
  when: string;
  description: string;
  official?: boolean;
};
