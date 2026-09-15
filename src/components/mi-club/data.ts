import {
  CakeSlice,
  Coffee,
  CupSoda,
  Croissant,
  Gift,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/**
 * Deterministic mock data for the /mi-club member dashboard. Everything here is
 * illustrative: no real account is loaded. Numbers are internally consistent
 * (points balance, lifetime, redeemable rewards, the earn history that sums to
 * lifetime) so the mockup reads as a real, coherent member view.
 */

export const MEMBER = {
  firstName: "Andrea",
  fullName: "Andrea Salazar",
  username: "andrea.salazar",
  cedula: "V-18.402.551",
  memberNo: "0042 8177 0356",
  tier: "De la casa",
  memberSince: "Marzo 2025",
  whatsapp: "+58 414 123 4567",
  email: "andrea.salazar@correo.com",
  homeBranch: "Bodega 1",
  qrValue: "https://labodega.example/m/0042-8177-0356",
} as const;

export const POINTS = {
  balance: 340,
  lifetime: 1240,
  thisMonth: 85,
  // Estimated value already enjoyed in redeemed rewards, in USD.
  savedValue: 46,
} as const;

export const HIGHLIGHTS = [
  { label: "Visitas este mes", value: "6", hint: "48 en total" },
  { label: "Racha", value: "5", hint: "semanas seguidas" },
  { label: "Ahorro estimado", value: "$46", hint: "en recompensas" },
] as const;

export type Reward = {
  name: string;
  points: number;
  category: string;
  note: string;
  image: string;
  Icon: LucideIcon;
};

/** Reward catalog. Affordability is derived from POINTS.balance at render time. */
export const REWARDS: Reward[] = [
  {
    name: "Café de la casa",
    points: 20,
    category: "Bebidas",
    note: "El de siempre, por la casa.",
    image: "1509440159596-0249088772ff",
    Icon: Coffee,
  },
  {
    name: "Pan o dulce",
    points: 35,
    category: "Panadería",
    note: "Una pieza participante recién horneada.",
    image: "1549931319-a545dcf3bc73",
    Icon: Croissant,
  },
  {
    name: "Postre del día",
    points: 60,
    category: "Dulce",
    note: "La pausa dulce para volver.",
    image: "1551024506-0bccd828d307",
    Icon: CakeSlice,
  },
  {
    name: "Desayuno completo",
    points: 100,
    category: "Menú",
    note: "Una selección completa de la mañana.",
    image: "1533089860892-a7c6f0a88666",
    Icon: UtensilsCrossed,
  },
  {
    name: "Brunch para dos",
    points: 260,
    category: "Menú",
    note: "Mesa compartida de fin de semana.",
    image: "1504754524776-8f4f37790ca0",
    Icon: CupSoda,
  },
  {
    name: "Torta artesanal",
    points: 450,
    category: "Especial",
    note: "Encárgala para tu próxima celebración.",
    image: "1578985545062-69928b1d9587",
    Icon: Gift,
  },
  {
    name: "Cena de temporada",
    points: 600,
    category: "Experiencia",
    note: "Menú del chef para dos personas.",
    image: "1414235077428-338989a2e8c0",
    Icon: Sparkles,
  },
];

export const MOST_FREQUENT = {
  name: "Café de la casa",
  detail: "Con leche, para llevar",
  timesInWindow: 24,
  windowLabel: "en los últimos 90 días",
  lastLabel: "Hace 2 días · Bodega 1",
  share: 38, // % of your orders
  image: "1509440159596-0249088772ff",
} as const;

export type PointsPoint = { month: string; earned: number };

/** Points earned per month (Feb–Sep 2026). Sums are consistent with lifetime. */
export const POINTS_SERIES: PointsPoint[] = [
  { month: "Feb", earned: 96 },
  { month: "Mar", earned: 132 },
  { month: "Abr", earned: 118 },
  { month: "May", earned: 164 },
  { month: "Jun", earned: 142 },
  { month: "Jul", earned: 188 },
  { month: "Ago", earned: 173 },
  { month: "Sep", earned: 85 },
];

export type Purchase = {
  dateLabel: string;
  date: string;
  branch: string;
  channel: "Mesa" | "Para llevar" | "Delivery" | "Panadería";
  summary: string;
  amount: number;
  points: number;
};

export const PURCHASES: Purchase[] = [
  {
    dateLabel: "13 Sep",
    date: "2026-09-13",
    branch: "Bodega 1",
    channel: "Mesa",
    summary: "Desayuno completo + café",
    amount: 18.4,
    points: 18,
  },
  {
    dateLabel: "9 Sep",
    date: "2026-09-09",
    branch: "Bodega 1",
    channel: "Para llevar",
    summary: "Café de la casa + medialunas",
    amount: 7.2,
    points: 7,
  },
  {
    dateLabel: "5 Sep",
    date: "2026-09-05",
    branch: "Bodega 2",
    channel: "Delivery",
    summary: "Brunch para dos",
    amount: 32.5,
    points: 33,
  },
  {
    dateLabel: "31 Ago",
    date: "2026-08-31",
    branch: "Bodega 1",
    channel: "Panadería",
    summary: "Pan de masa madre + postre",
    amount: 12.9,
    points: 13,
  },
  {
    dateLabel: "27 Ago",
    date: "2026-08-27",
    branch: "Bodega 3",
    channel: "Mesa",
    summary: "Almuerzo del día + limonada",
    amount: 15.6,
    points: 16,
  },
  {
    dateLabel: "22 Ago",
    date: "2026-08-22",
    branch: "Bodega 1",
    channel: "Para llevar",
    summary: "Café de la casa",
    amount: 3.5,
    points: 4,
  },
];

export type ClubEvent = {
  kind: "descuento" | "evento" | "cumple";
  tag: string;
  title: string;
  when: string;
  description: string;
  official?: boolean;
};

export const EVENTS: ClubEvent[] = [
  {
    kind: "descuento",
    tag: "Puntos dobles",
    title: "Fin de semana x2",
    when: "Sáb 20 – Dom 21 Sep",
    description: "Cada compra suma el doble en las tres sucursales.",
    official: true,
  },
  {
    kind: "evento",
    tag: "Taller",
    title: "Panadería de masa madre",
    when: "Jue 25 Sep · 6:00 pm",
    description: "Cupos limitados para socios. Canje: 120 pts o $15.",
  },
  {
    kind: "descuento",
    tag: "Solo socios",
    title: "20% en postres",
    when: "Todo septiembre",
    description: "Descuento oficial aplicado al mostrar tu QR.",
    official: true,
  },
  {
    kind: "cumple",
    tag: "Tu mes",
    title: "Semana de cumpleaños",
    when: "Del 12 al 18 Oct",
    description: "Un postre de regalo y 50 puntos extra para celebrar.",
  },
];
