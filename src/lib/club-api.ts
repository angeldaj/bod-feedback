// Adapter de Bodega Club v2 (mi-club): tarjeta con piel por nivel, diseños de
// tarjeta, Bodega Wallet de vouchers, catálogo de canje y actividad.
//
// Contrato: spec 075 de bodega-api (`GET /loyalty/me/card`, `/me/card-designs`,
// `PUT /me/card-design`, `/me/vouchers`, `/me/rewards`, `POST /me/redemptions`,
// `/me/timeline`), spec 077 para la ruleta (`GET/POST /loyalty/me/spins`) y
// spec 087 para las campañas de Instagram (`GET /loyalty/me/social-campaigns`,
// `POST /loyalty/me/social-campaigns/:id/code`). El raspadito de Navidad aún no
// tiene spec en bodega-api: por ahora solo lo implementa el mock.
// Dos adaptadores con la misma interfaz:
// - `createLiveClubAdapter`: el backend real con la sesión Bearer del socio
//   (lo usa `/mi-club`).
// - `createMockClubAdapter`: datos de ejemplo en memoria, sin login, para la
//   demostración en `/club-mock`.
//
// Mismo patrón que `loyalty-api.ts` / `feedback-api.ts`: único punto de
// contacto con los endpoints del club v2 desde la landing.

import type { Member } from "./loyalty-api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://app.bod-service.cloud/api";

// ---------------------------------------------------------------------------
// Tipos del contrato
// ---------------------------------------------------------------------------

/** Piel de la tarjeta. La define el nivel (enum cerrado, diseñado a mano). */
export type CardSkin = "cobre" | "plata" | "oro" | "rose" | "obsidiana" | "perla" | "prisma";

export type ClubTier = {
  rank: number;
  name: string;
  skin: CardSkin;
  minLifetimePoints: number;
  /** Regalo que se emite como voucher al llegar a este nivel. */
  perk: string | null;
};

export type NextTier = ClubTier & {
  pointsToGo: number;
  /** 0-100, progreso desde el nivel actual. */
  progressPct: number;
  /** Nombre del diseño de tarjeta que se desbloquea al llegar. */
  unlocksDesign: string | null;
};

export type ClubCard = {
  memberNo: string;
  holderName: string;
  qrValue: string;
  balance: number;
  lifetime: number;
  visits: number;
  memberSince: string;
  tier: ClubTier;
  nextTier: NextTier | null;
  /** Id del diseño (textura) elegido por el socio. */
  designId: string;
};

export type CardDesignCategory = "free" | "earned" | "season";

export type CardDesign = {
  /** Id estable; la textura vive en el frontend (`/club/texturas/<id>.webp`). */
  id: string;
  name: string;
  category: CardDesignCategory;
  description: string;
  unlocked: boolean;
  /** Texto de la regla, ya resuelto por el backend ("Se gana con 10 visitas. Llevas 7."). */
  unlockLabel: string;
};

export type VoucherOrigin = "redemption" | "grant" | "spin";
export type GrantReason = "manual" | "segment" | "complaint" | "tier_up" | "ticket";
export type VoucherKind = "percent" | "amount" | "product";
export type VoucherStatus = "active" | "used" | "expired" | "cancelled";

export type Voucher = {
  id: string;
  origin: VoucherOrigin;
  grantReason: GrantReason | null;
  kind: VoucherKind;
  title: string;
  /** Etiqueta corta del valor: "10%", "$5", "Gratis", "120 pts". */
  valueLabel: string;
  /** Categoría del producto, para el ícono ("Desayuno", "Postres"...). */
  category: string | null;
  code: string;
  qrValue: string;
  expiresAt: string;
  status: VoucherStatus;
  /** Contexto del regalo: "Por tu caso Q-0042", "Regalo por subir a Plata". */
  note: string | null;
  usedAt: string | null;
  usedAtBranch: string | null;
};

export type ClubReward = {
  id: string;
  name: string;
  category: string;
  description: string;
  points: number;
  imageUrl: string | null;
  featured: boolean;
};

export type ActivityLine = { name: string; qty: number; amount: number };

export type ActivityItem =
  | {
      id: string;
      type: "purchase";
      occurredAt: string;
      title: string;
      branch: string;
      channel: "Mesa" | "Para llevar" | "Delivery" | "Panadería";
      payment: string;
      amount: number;
      points: number;
      lines: ActivityLine[];
    }
  | {
      id: string;
      /** `social`: puntos por un comentario validado en Instagram (spec 087). */
      type: "redemption" | "grant" | "social";
      occurredAt: string;
      title: string;
      detail: string;
      points: number;
      category: string | null;
    };

export type MonthlyPoints = { month: string; earned: number };

export type ClubActivity = {
  items: ActivityItem[];
  monthly: MonthlyPoints[];
  thisMonth: { spent: number; points: number; visits: number; favoriteBranch: string | null };
};

// Campañas de Instagram (spec 087). El backend valida el comentario con el
// webhook de Meta; la landing nunca habla con Instagram ni declara un premio.
export type SocialParticipation = "available" | "pending" | "completed" | "closed";

export type SocialCampaign = {
  id: string;
  title: string;
  instructions: string;
  /** Enlace a la publicación oficial. */
  postUrl: string;
  points: number;
  startsAt: string;
  endsAt: string;
  status: "draft" | "active" | "paused" | "closed";
  participationStatus: SocialParticipation;
  /** Código personal `BC-XXXXXX`; null si aún no lo pidió o la campaña cerró. */
  code: string | null;
  completedAt: string | null;
};

export type SocialCampaignCode = {
  campaignId: string;
  code: string;
  expiresAt: string;
  participationStatus: SocialParticipation;
};

/** Publicación reciente de Instagram para el feed de Inicio (el backend la cachea). */
export type InstagramPost = {
  id: string;
  permalink: string;
  caption: string | null;
  /** IMAGE, VIDEO o CAROUSEL_ALBUM. */
  mediaType: string;
  thumbnailUrl: string;
  timestamp: string | null;
};

// Ruleta (spec 077). Sin pesos ni stock: eso solo lo ve club-web.
export type SpinPrizeType = "points" | "voucher";

export type SpinSegment = {
  id: string;
  label: string;
  prizeType: SpinPrizeType;
  /** Clave de diseño (`crema`, `mostaza`...); el color real vive en el frontend. */
  color: string;
  /** Clave de diseño (`coin`, `coffee`...); el ícono real vive en el frontend. */
  icon: string;
  order: number;
};

export type SpinWheel = { versionId: string; segments: SpinSegment[] };

export type SpinRecord = {
  id: string;
  segmentId: string;
  label: string;
  prizeType: SpinPrizeType;
  pointsAwarded: number | null;
  voucherId: string | null;
  createdAt: string;
};

export type SpinState = {
  available: number;
  /** Compras elegibles hacia la próxima tirada: `{ current: 2, required: 3 }` → 2/3. */
  progress: { current: number; required: number };
  /** `null` = sin ruleta activa: la tarjeta de la ruleta no se muestra. */
  wheel: SpinWheel | null;
  /** Últimas 10, recientes primero. */
  recent: SpinRecord[];
};

export type SpinResult = {
  spinId: string;
  /** La rueda aterriza en este segmento. */
  segmentId: string;
  prize: { type: SpinPrizeType; points: number | null; label: string };
  voucher: Voucher | null;
  available: number;
};

// Raspadito de Navidad: tickets impresos del pan de jamón, cada uno con un código
// BodegaClub único debajo de la capa raspable.
export type TicketStock = { key: string; label: string; total: number; left: number };

export type TicketPromo = {
  /** Último momento para activar tickets y cobrar sus premios. */
  endsAt: string;
  /** Sorteo en vivo entre los tickets sin premio. */
  drawAt: string;
  /** Cada `required` tickets activados, un pan de jamón de regalo. */
  collection: { current: number; required: number };
  drawEntries: number;
  /** Códigos inexistentes que puede probar antes de la pausa. */
  attemptsLeft: number;
  /** Pausa por demasiados códigos inexistentes; `null` = puede activar. */
  lockedUntil: string | null;
  /** Premios que quedan por cobrar, por cualquier vía (app o caja). */
  stock: TicketStock[];
};

/** `claimed` = el premio ya se entregó en caja antes de activarlo aquí. */
export type TicketOutcome = "product" | "cash" | "none" | "claimed";

export type TicketActivation = {
  code: string;
  lot: string;
  outcome: TicketOutcome;
  prize: { label: string; category: string } | null;
  /** Premio guardado en la Wallet (producto o efectivo). */
  voucher: Voucher | null;
  claimed: { date: string; branch: string } | null;
  /** Sin premio: segunda oportunidad (ruleta del ticket virtual) y una participación en el sorteo. */
  secondChance: TicketSecondChance | null;
  /** Regalo por completar la colección con este ticket. */
  collectionVoucher: Voucher | null;
  promo: TicketPromo;
};

/**
 * Segunda oportunidad de un ticket sin premio: una ruleta que la decide el
 * servidor al activar (60 % gana un ticket virtual BC). El ticket virtual se
 * raspa y trae un premio del pool interno: puntos (ya sumados) o un voucher.
 */
export type TicketSecondChance = {
  won: boolean;
  /** Código del ticket virtual; `null` si no ganó. */
  virtualCode: string | null;
  prize: { label: string; category: string | null; points: number | null } | null;
  voucher: Voucher | null;
};

export class ClubApiError extends Error {
  status: number;
  /** Código de negocio (`NO_SPINS_AVAILABLE`, `NO_ACTIVE_WHEEL`...), si el backend lo manda. */
  code: string | null;
  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "ClubApiError";
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Adaptador live (backend real, spec 075)
// ---------------------------------------------------------------------------

export type AuthedRequest = <T>(fn: (accessToken: string) => Promise<T>) => Promise<T>;

async function request<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Error ${response.status}`;
    const code =
      body && typeof body === "object" && "code" in body ? String((body as { code: unknown }).code) : null;
    throw new ClubApiError(message, response.status, code);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// DTOs del backend (openapi.json de bodega-api, spec 075).
type CardTierDto = { rank: number; name: string; skin: CardSkin; minLifetimePoints: number; perk: string | null };
type ClubCardDto = {
  memberNo: string;
  holderName: string;
  qrValue: string;
  balance: number;
  lifetime: number;
  visits: number;
  memberSince: string;
  tier: CardTierDto | null;
  nextTier: (CardTierDto & { pointsToGo: number; progressPct: number; unlocksDesign: string | null }) | null;
  designId: string;
};
type MemberRewardsDto = {
  available: number;
  rewards: {
    id: string;
    name: string;
    description: string | null;
    pointsCost: number;
    category: string | null;
    imageUrl: string | null;
    affordable: boolean;
  }[];
};
type RedemptionWithVoucherDto = { voucher: Voucher };

/** Sin niveles configurados el backend manda `tier: null`; la tarjeta igual necesita una piel. */
const FALLBACK_TIER: ClubTier = { rank: 0, name: "Socio", skin: "cobre", minLifetimePoints: 0, perk: null };

export function memberSinceLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-VE", { month: "long", year: "numeric" }).replace(" de ", " ");
}

function mapCard(dto: ClubCardDto): ClubCard {
  return {
    memberNo: dto.memberNo,
    holderName: dto.holderName,
    qrValue: dto.qrValue,
    balance: dto.balance,
    lifetime: dto.lifetime,
    visits: dto.visits,
    memberSince: memberSinceLabel(dto.memberSince),
    tier: dto.tier ?? FALLBACK_TIER,
    nextTier: dto.nextTier,
    designId: dto.designId,
  };
}

function mapRewards(dto: MemberRewardsDto): ClubReward[] {
  const rewards = dto.rewards.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category ?? "Especial",
    description: r.description ?? "",
    points: r.pointsCost,
    imageUrl: r.imageUrl,
    featured: false,
  }));
  // Sin dato de popularidad todavía: destacamos la canjeable más económica.
  const cheapest = rewards
    .filter((r) => r.points <= dto.available)
    .sort((a, b) => a.points - b.points)[0];
  if (cheapest) cheapest.featured = true;
  return rewards;
}
// ---------------------------------------------------------------------------
// Fuente "mock" (en memoria, por sesión de navegador)
// ---------------------------------------------------------------------------

export const TIERS: ClubTier[] = [
  { rank: 0, name: "Cobre", skin: "cobre", minLifetimePoints: 0, perk: null },
  { rank: 1, name: "Plata", skin: "plata", minLifetimePoints: 400, perk: "10% en delivery" },
  { rank: 2, name: "Oro", skin: "oro", minLifetimePoints: 1000, perk: "15% en tu próxima cena" },
  { rank: 3, name: "Obsidiana", skin: "obsidiana", minLifetimePoints: 2500, perk: "Postre de la casa" },
  { rank: 4, name: "Prisma", skin: "prisma", minLifetimePoints: 5000, perk: "Mesa preferente en eventos" },
];

type DesignRule =
  | { type: "free" }
  | { type: "visits"; n: number }
  | { type: "tier"; minRank: number }
  | { type: "season"; from: string; to: string; label: string };

const DESIGN_CATALOG: { id: string; name: string; description: string; rule: DesignRule }[] = [
  { id: "clasica", name: "Clásica", description: "El guilloché de siempre, grabado en líneas finas.", rule: { type: "free" } },
  { id: "masa", name: "Masa madre", description: "La miga abierta de nuestro pan de fermentación lenta.", rule: { type: "free" } },
  { id: "trigo", name: "Trigo", description: "Espigas en trazo fino, como en los sacos de harina.", rule: { type: "free" } },
  { id: "confluencia", name: "Confluencia", description: "El Orinoco y el Caroní corren juntos frente a Puerto Ordaz sin mezclarse.", rule: { type: "visits", n: 10 } },
  { id: "horno", name: "Horno", description: "Ondas de calor y brasas del horno de leña.", rule: { type: "tier", minRank: 2 } },
  { id: "mosaico", name: "Mosaico", description: "La baldosa hidráulica del piso de la casa.", rule: { type: "tier", minRank: 4 } },
  { id: "temporada", name: "Navidad", description: "Estrellas de hallaca y pan de jamón. Solo en diciembre.", rule: { type: "season", from: "12-01", to: "01-06", label: "del 1 de diciembre al 6 de enero" } },
];

const MOCK_REWARDS: ClubReward[] = [
  { id: "r1", name: "Café + croissant", category: "Desayuno", description: "Café con leche y croissant de mantequilla, en cualquier sede.", points: 120, imageUrl: null, featured: true },
  { id: "r4", name: "Jugo natural", category: "Bebidas", description: "Parchita, fresa o lechosa, del tamaño grande.", points: 90, imageUrl: null, featured: false },
  { id: "r5", name: "Cachito de jamón", category: "Panadería", description: "Recién horneado, para comer aquí o llevar.", points: 80, imageUrl: null, featured: false },
  { id: "r6", name: "Porción de tres leches", category: "Postres", description: "La torta de la casa, porción generosa.", points: 220, imageUrl: null, featured: false },
  { id: "r2", name: "Pan de jamón entero", category: "Panadería", description: "Receta de la casa, para llevar a la mesa familiar.", points: 450, imageUrl: null, featured: false },
  { id: "r3", name: "Desayuno criollo", category: "Desayuno", description: "Arepas, perico, caraotas, queso de mano y café.", points: 600, imageUrl: null, featured: false },
  { id: "r7", name: "Parrilla para dos", category: "Almuerzo", description: "Carne, pollo, chorizo, yuca y guasacaca.", points: 1200, imageUrl: null, featured: false },
];

// Ruleta sembrada por la migración de la spec 077 (v1): mismas etiquetas, claves
// de color/ícono y pesos. Los pesos y premios solo los conoce el mock (en
// producción el sorteo es del servidor).
const PURCHASES_PER_SPIN = 3;
const PRIZE_VOUCHER_TTL_DAYS = 7;

type MockSegment = SpinSegment & {
  weight: number;
  points?: number;
  voucher?: { kind: VoucherKind; valueLabel: string };
};

const MOCK_WHEEL: MockSegment[] = [
  { id: "ruleta-v1-s1", order: 1, label: "+5 pts", prizeType: "points", color: "crema", icon: "coin", weight: 30, points: 5 },
  { id: "ruleta-v1-s2", order: 2, label: "+10 pts", prizeType: "points", color: "mostaza", icon: "coins", weight: 20, points: 10 },
  { id: "ruleta-v1-s3", order: 3, label: "Café americano", prizeType: "voucher", color: "cafe", icon: "coffee", weight: 12, voucher: { kind: "product", valueLabel: "Gratis" } },
  { id: "ruleta-v1-s4", order: 4, label: "10% en tu próxima compra", prizeType: "voucher", color: "tomate", icon: "percent", weight: 10, voucher: { kind: "percent", valueLabel: "10%" } },
  { id: "ruleta-v1-s5", order: 5, label: "+25 pts", prizeType: "points", color: "oro", icon: "star", weight: 8, points: 25 },
  { id: "ruleta-v1-s6", order: 6, label: "Cachito de jamón", prizeType: "voucher", color: "trigo", icon: "croissant", weight: 8, voucher: { kind: "product", valueLabel: "Gratis" } },
  { id: "ruleta-v1-s7", order: 7, label: "Postre del día", prizeType: "voucher", color: "frambuesa", icon: "cake", weight: 8, voucher: { kind: "product", valueLabel: "Gratis" } },
  { id: "ruleta-v1-s8", order: 8, label: "Jugo natural", prizeType: "voucher", color: "naranja", icon: "juice", weight: 4, voucher: { kind: "product", valueLabel: "Gratis" } },
];

// Raspadito: existencias de ejemplo sobre el pedido real (15.000 tickets, 3 lotes).
const TICKET_PROMO_END = "2027-01-06T23:59:00-04:00";
const TICKET_DRAW_AT = "2027-01-06T20:00:00-04:00";
const TICKETS_PER_GIFT = 5;
const TICKET_MAX_ATTEMPTS = 5;
const TICKET_LOCK_MS = 15 * 60_000;
const TICKET_STOCK: TicketStock[] = [
  { key: "c500", label: "$500", total: 3, left: 2 },
  { key: "c100", label: "$100", total: 1, left: 1 },
  { key: "c50", label: "$50", total: 1, left: 0 },
  { key: "c20", label: "$20", total: 8, left: 5 },
  { key: "c10", label: "$10", total: 9, left: 6 },
  { key: "c5", label: "$5", total: 20, left: 13 },
  { key: "jamon", label: "Pan de jamón", total: 50, left: 31 },
  { key: "almuerzo", label: "Almuerzo", total: 30, left: 18 },
  { key: "postre", label: "Postre surtido", total: 100, left: 64 },
  { key: "frances", label: "Pan francés", total: 100, left: 59 },
  { key: "refresco", label: "Refresco 2L", total: 100, left: 57 },
];

// Segunda oportunidad: 60 % de los tickets sin premio ganan un ticket virtual BC.
const SECOND_CHANCE_ODDS = 0.6;
const SECOND_CHANCE_POOL: { label: string; category: string | null; points?: number; weight: number }[] = [
  { label: "+50 pts", category: null, points: 50, weight: 30 },
  { label: "+100 pts", category: null, points: 100, weight: 15 },
  { label: "Cachito de jamón", category: "Panadería", weight: 20 },
  { label: "Postre del día", category: "Postres", weight: 15 },
  { label: "Refresco 2L", category: "Bebidas", weight: 15 },
  { label: "Pan de jamón", category: "Panadería", weight: 5 },
];

type DemoPrize = { label: string; category: string; key: string };
type DemoTicket =
  | { lot: string; outcome: "product" | "cash"; prize: DemoPrize }
  | { lot: string; outcome: "claimed"; prize: DemoPrize; claimed: { date: string; branch: string } }
  | { lot: string; outcome: "none"; /** Demo: fuerza la segunda oportunidad; sin valor, 60 % al azar. */ chance?: boolean }
  | { lot: string; outcome: "taken" };

// Códigos de ejemplo: ninguno existe en la lista impresa.
const DEMO_TICKETS: Record<string, DemoTicket> = {
  K4WZT: { lot: "L1", outcome: "product", prize: { label: "Pan de jamón", category: "Panadería", key: "jamon" } },
  W9GSU: { lot: "L3", outcome: "product", prize: { label: "Postre surtido", category: "Postres", key: "postre" } },
  R3NVD: { lot: "L2", outcome: "cash", prize: { label: "$20", category: "Efectivo", key: "c20" } },
  H6CYE: { lot: "L3", outcome: "none", chance: true },
  M8XQC: { lot: "L1", outcome: "none", chance: false },
  F5KQY: { lot: "L2", outcome: "none" },
  T2LBF: { lot: "L2", outcome: "claimed", prize: { label: "Pan francés", category: "Panadería", key: "frances" }, claimed: { date: "2026-11-09T15:20:00-04:00", branch: "Sede Alta Vista" } },
  PJ7RN: { lot: "L1", outcome: "taken" },
};

/** Para la demo: qué probar con cada código. */
export const DEMO_TICKET_HINTS: { code: string; label: string }[] = [
  { code: "K4WZT", label: "Pan de jamón" },
  { code: "R3NVD", label: "$20 en efectivo" },
  { code: "H6CYE", label: "Sin premio, gana ticket BC" },
  { code: "M8XQC", label: "Sin premio, sin ticket BC" },
  { code: "F5KQY", label: "Sin premio, ruleta al azar" },
  { code: "T2LBF", label: "Cobrado en caja" },
  { code: "W9GSU", label: "Postre" },
  { code: "PJ7RN", label: "De otra cuenta" },
];

type MockStore = {
  memberKey: string;
  holderName: string;
  memberNo: string;
  memberSince: string;
  balance: number;
  lifetime: number;
  visits: number;
  designId: string;
  vouchers: Voucher[];
  activity: ActivityItem[];
  spins: { available: number; pending: number; recent: SpinRecord[]; byKey: Map<string, SpinResult> };
  social: SocialCampaign[];
  tickets: { collection: number; entries: number; used: Set<string>; attemptsLeft: number; lockedUntil: number; stock: TicketStock[] };
};

let store: MockStore | null = null;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}

function isoDaysAgo(days: number, hour = 12): string {
  const d = new Date(Date.now() - days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function seedStore(member: Member | null): MockStore {
  const now = Date.now();
  const voucher = (v: Omit<Voucher, "id" | "code" | "qrValue" | "status" | "usedAt" | "usedAtBranch"> & Partial<Voucher>): Voucher => {
    const code = v.code ?? randomCode();
    return { id: `v-${code}`, code, qrValue: `LBVCH:${code}`, status: "active", usedAt: null, usedAtBranch: null, ...v };
  };
  return {
    memberKey: member?.id ?? "demo",
    holderName: member?.fullName ?? "Daniela Marcano",
    memberNo: member?.memberNo ?? "BC 0048 12",
    memberSince: member?.memberSince || "marzo 2025",
    balance: member?.points.balance ?? 340,
    lifetime: member?.points.lifetime ?? 820,
    visits: 7,
    designId: "clasica",
    vouchers: [
      voucher({ origin: "redemption", grantReason: null, kind: "product", title: "Café + croissant", valueLabel: "120 pts", category: "Desayuno", code: "K7Q-4MD", expiresAt: new Date(now + 23 * HOUR + 12 * 60_000).toISOString(), note: null }),
      voucher({ origin: "grant", grantReason: "tier_up", kind: "percent", title: "10% en delivery", valueLabel: "10%", category: "Delivery", code: "R2T-9WA", expiresAt: new Date(now + 9 * DAY).toISOString(), note: "Regalo por subir a Plata" }),
      voucher({ origin: "grant", grantReason: "complaint", kind: "product", title: "Postre de la casa", valueLabel: "Gratis", category: "Postres", code: "Q42-7NP", expiresAt: new Date(now + 14 * DAY).toISOString(), note: "Por tu caso Q-0042" }),
      voucher({ origin: "redemption", grantReason: null, kind: "product", title: "Jugo natural", valueLabel: "90 pts", category: "Bebidas", expiresAt: isoDaysAgo(13), note: null, status: "used", usedAt: isoDaysAgo(13, 10), usedAtBranch: "Sede Alta Vista" }),
      voucher({ origin: "grant", grantReason: "manual", kind: "product", title: "Cachito de jamón", valueLabel: "Gratis", category: "Panadería", expiresAt: isoDaysAgo(23), note: "Regalo de bienvenida", status: "expired" }),
    ],
    activity: [
      { id: "a1", type: "purchase", occurredAt: isoDaysAgo(3, 13), title: "Almuerzo en mesa", branch: "Sede Alta Vista", channel: "Mesa", payment: "Pago móvil", amount: 38.2, points: 38, lines: [{ name: "Pabellón criollo", qty: 1, amount: 14.5 }, { name: "Arepa reina pepiada", qty: 1, amount: 7.9 }, { name: "Jugo de parchita", qty: 2, amount: 7.6 }, { name: "Quesillo", qty: 1, amount: 8.2 }] },
      { id: "a2", type: "purchase", occurredAt: isoDaysAgo(6, 8), title: "Panadería para llevar", branch: "Sede Villa Colombia", channel: "Para llevar", payment: "Efectivo", amount: 12.4, points: 12, lines: [{ name: "Pan campesino", qty: 2, amount: 5.2 }, { name: "Cachito de jamón", qty: 2, amount: 4.8 }, { name: "Golfeado", qty: 1, amount: 2.4 }] },
      { id: "a3", type: "purchase", occurredAt: isoDaysAgo(11, 20), title: "Delivery, pedido 4471", branch: "Desde Sede Alta Vista", channel: "Delivery", payment: "Zelle", amount: 27.9, points: 27, lines: [{ name: "Parrilla mixta", qty: 1, amount: 19.9 }, { name: "Tequeños x12", qty: 1, amount: 8 }] },
      { id: "a4", type: "redemption", occurredAt: isoDaysAgo(13, 10), title: "Canjeaste un jugo natural", detail: "Usado en Sede Alta Vista", points: -90, category: "Bebidas" },
      { id: "a5", type: "purchase", occurredAt: isoDaysAgo(17, 9), title: "Desayuno en mesa", branch: "Sede Alta Vista", channel: "Mesa", payment: "Tarjeta", amount: 19.6, points: 19, lines: [{ name: "Desayuno criollo", qty: 1, amount: 13.6 }, { name: "Café con leche", qty: 2, amount: 6 }] },
      { id: "a6", type: "grant", occurredAt: isoDaysAgo(23, 11), title: "Subiste a Plata", detail: "Te regalamos 10% en delivery", points: 0, category: null },
      { id: "a7", type: "purchase", occurredAt: isoDaysAgo(28, 13), title: "Almuerzo en mesa", branch: "Sede Villa Colombia", channel: "Mesa", payment: "Pago móvil", amount: 41, points: 41, lines: [{ name: "Asado negro", qty: 1, amount: 16 }, { name: "Hervido de gallina", qty: 1, amount: 12.5 }, { name: "Papelón con limón", qty: 2, amount: 6 }, { name: "Bienmesabe", qty: 1, amount: 6.5 }] },
      { id: "a8", type: "purchase", occurredAt: isoDaysAgo(36, 8), title: "Panadería para llevar", branch: "Sede Alta Vista", channel: "Para llevar", payment: "Efectivo", amount: 9.8, points: 9, lines: [{ name: "Pan francés", qty: 4, amount: 4 }, { name: "Acemita", qty: 1, amount: 2.6 }, { name: "Pan dulce", qty: 1, amount: 3.2 }] },
    ],
    // Bienvenida + tirada de lanzamiento, y una compra hacia la próxima.
    spins: { available: 2, pending: 1, recent: [], byKey: new Map() },
    tickets: { collection: 3, entries: 1, used: new Set(), attemptsLeft: TICKET_MAX_ATTEMPTS, lockedUntil: 0, stock: TICKET_STOCK.map((x) => ({ ...x })) },
    social: [
      {
        id: "sc-demo",
        title: "Comenta tu pan favorito",
        instructions: "Copia tu código y escríbelo en un comentario de la publicación. Cuenta un premio por socio.",
        postUrl: "https://www.instagram.com/",
        points: 10,
        startsAt: new Date(now - 2 * DAY).toISOString(),
        endsAt: new Date(now + 12 * DAY).toISOString(),
        status: "active",
        participationStatus: "available",
        code: null,
        completedAt: null,
      },
    ],
  };
}

function ensureStore(member: Member | null): MockStore {
  const key = member?.id ?? "demo";
  if (!store || store.memberKey !== key) store = seedStore(member);
  return store;
}

function tierFor(lifetime: number): ClubTier {
  return [...TIERS].reverse().find((t) => lifetime >= t.minLifetimePoints) ?? TIERS[0];
}

function isInSeason(from: string, to: string, date = new Date()): boolean {
  const md = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

function resolveDesigns(s: MockStore): CardDesign[] {
  const tier = tierFor(s.lifetime);
  return DESIGN_CATALOG.map(({ id, name, description, rule }) => {
    switch (rule.type) {
      case "free":
        return { id, name, description, category: "free", unlocked: true, unlockLabel: "Libre para todos los socios" };
      case "visits": {
        const ok = s.visits >= rule.n;
        return { id, name, description, category: "earned", unlocked: ok, unlockLabel: ok ? `Ganado con ${rule.n} visitas` : `Se gana con ${rule.n} visitas. Llevas ${s.visits}.` };
      }
      case "tier": {
        const ok = tier.rank >= rule.minRank;
        const tierName = TIERS[rule.minRank]?.name ?? "";
        return { id, name, description, category: "earned", unlocked: ok, unlockLabel: ok ? `Ganado al llegar a ${tierName}` : `Se gana al llegar a ${tierName}` };
      }
      case "season": {
        const ok = isInSeason(rule.from, rule.to);
        return { id, name, description, category: "season", unlocked: ok, unlockLabel: ok ? `Disponible ${rule.label}` : `Disponible ${rule.label}` };
      }
    }
  });
}

function buildCard(s: MockStore): ClubCard {
  const tier = tierFor(s.lifetime);
  const next = TIERS[tier.rank + 1] ?? null;
  const designForNext = next
    ? DESIGN_CATALOG.find((d) => d.rule.type === "tier" && d.rule.minRank === next.rank)?.name ?? null
    : null;
  return {
    memberNo: s.memberNo,
    holderName: s.holderName,
    qrValue: `LBCLUB:${s.memberNo.replace(/\s/g, "")}`,
    balance: s.balance,
    lifetime: s.lifetime,
    visits: s.visits,
    memberSince: s.memberSince,
    tier,
    designId: s.designId,
    nextTier: next
      ? {
          ...next,
          pointsToGo: Math.max(0, next.minLifetimePoints - s.lifetime),
          progressPct: Math.min(100, Math.round(((s.lifetime - tier.minLifetimePoints) / (next.minLifetimePoints - tier.minLifetimePoints)) * 100)),
          unlocksDesign: designForNext,
        }
      : null,
  };
}

function buildActivity(s: MockStore): ClubActivity {
  const byMonth = new Map<string, number>();
  const base = [42, 88, 64, 120, 50];
  const now = new Date();
  for (let i = 5; i >= 1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    byMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, base[5 - i]);
  }
  const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const monthKey = keyOf(now);
  const thisMonthItems = s.activity.filter((a) => keyOf(new Date(a.occurredAt)) === monthKey);
  const purchases = thisMonthItems.filter((a): a is Extract<ActivityItem, { type: "purchase" }> => a.type === "purchase");
  const earned = purchases.reduce((sum, p) => sum + p.points, 0);
  byMonth.set(monthKey, earned);
  const branches = new Map<string, number>();
  purchases.forEach((p) => branches.set(p.branch, (branches.get(p.branch) ?? 0) + 1));
  const favorite = [...branches.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return {
    items: [...s.activity].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)),
    monthly: [...byMonth.entries()].map(([month, value]) => ({ month, earned: value })),
    thisMonth: { spent: purchases.reduce((sum, p) => sum + p.amount, 0), points: earned, visits: purchases.length, favoriteBranch: favorite?.replace(/^Desde /, "") ?? null },
  };
}

function buildSpinState(s: MockStore): SpinState {
  return {
    available: s.spins.available,
    progress: { current: s.spins.pending, required: PURCHASES_PER_SPIN },
    wheel: {
      versionId: "ruleta-v1",
      segments: MOCK_WHEEL.map(({ id, label, prizeType, color, icon, order }) => ({ id, label, prizeType, color, icon, order })),
    },
    recent: [...s.spins.recent],
  };
}

/** Sorteo ponderado local (en producción lo hace el servidor) y su efecto en el store. */
function drawSpin(s: MockStore): SpinResult {
  const total = MOCK_WHEEL.reduce((sum, seg) => sum + seg.weight, 0);
  let roll = Math.random() * total;
  const seg = MOCK_WHEEL.find((x) => (roll -= x.weight) < 0) ?? MOCK_WHEEL[0];
  const now = new Date().toISOString();
  s.spins.available -= 1;
  let voucher: Voucher | null = null;
  if (seg.points) {
    s.balance += seg.points;
    s.lifetime += seg.points;
  } else if (seg.voucher) {
    const code = randomCode();
    voucher = {
      id: `v-${code}`, origin: "spin", grantReason: null, kind: seg.voucher.kind, title: seg.label,
      valueLabel: seg.voucher.valueLabel, category: null, code, qrValue: `LBVCH:${code}`,
      expiresAt: new Date(Date.now() + PRIZE_VOUCHER_TTL_DAYS * DAY).toISOString(), status: "active",
      note: "Premio de la ruleta", usedAt: null, usedAtBranch: null,
    };
    s.vouchers.unshift(voucher);
    s.activity.unshift({ id: `a-${code}`, type: "grant", occurredAt: now, title: `Ganaste en la ruleta: ${seg.label.toLowerCase()}`, detail: "Guardado en tu Wallet", points: 0, category: null });
  }
  const spinId = `sp-${randomCode()}`;
  s.spins.recent = [
    { id: spinId, segmentId: seg.id, label: seg.label, prizeType: seg.prizeType, pointsAwarded: seg.points ?? null, voucherId: voucher?.id ?? null, createdAt: now },
    ...s.spins.recent,
  ].slice(0, 10);
  return {
    spinId,
    segmentId: seg.id,
    prize: { type: seg.prizeType, points: seg.points ?? null, label: seg.label },
    voucher,
    available: s.spins.available,
  };
}

function buildTicketPromo(s: MockStore): TicketPromo {
  const t = s.tickets;
  return {
    endsAt: TICKET_PROMO_END,
    drawAt: TICKET_DRAW_AT,
    collection: { current: t.collection, required: TICKETS_PER_GIFT },
    drawEntries: t.entries,
    attemptsLeft: t.attemptsLeft,
    lockedUntil: t.lockedUntil > Date.now() ? new Date(t.lockedUntil).toISOString() : null,
    stock: t.stock.map((x) => ({ ...x })),
  };
}

function ticketVoucher(s: MockStore, title: string, category: string, valueLabel: string, note: string): Voucher {
  const code = randomCode();
  const voucher: Voucher = {
    id: `v-${code}`, origin: "grant", grantReason: "ticket", kind: category === "Efectivo" ? "amount" : "product", title,
    valueLabel, category, code, qrValue: `LBVCH:${code}`, expiresAt: new Date(TICKET_PROMO_END).toISOString(), status: "active",
    note, usedAt: null, usedAtBranch: null,
  };
  s.vouchers.unshift(voucher);
  return voucher;
}

/** Activación local (en producción la valida el servidor contra la lista impresa). */
function activateDemoTicket(s: MockStore, raw: string): TicketActivation {
  const t = s.tickets;
  const now = Date.now();
  const code = raw.trim().toUpperCase();
  if (now > new Date(TICKET_PROMO_END).getTime()) throw new ClubApiError("El raspadito terminó el 6 de enero.", 410, "PROMO_ENDED");
  if (t.lockedUntil > now) throw new ClubApiError("Probaste varios códigos que no existen. Espera unos minutos.", 429, "TOO_MANY_ATTEMPTS");
  if (t.used.has(code)) throw new ClubApiError("Ya activaste este ticket. Lo ves en tu colección.", 409, "TICKET_ALREADY_YOURS");
  const ticket = DEMO_TICKETS[code];
  if (!ticket) {
    t.attemptsLeft -= 1;
    if (t.attemptsLeft <= 0) {
      t.attemptsLeft = TICKET_MAX_ATTEMPTS;
      t.lockedUntil = now + TICKET_LOCK_MS;
      throw new ClubApiError("Probaste varios códigos que no existen. Espera unos minutos.", 429, "TOO_MANY_ATTEMPTS");
    }
    throw new ClubApiError("No encontramos ese código. Revísalo letra por letra.", 404, "TICKET_NOT_FOUND");
  }
  if (ticket.outcome === "taken") {
    throw new ClubApiError("Este ticket ya se activó en otra cuenta. Si es tuyo, llévalo a caja y lo revisamos.", 409, "TICKET_TAKEN");
  }
  t.used.add(code);
  t.attemptsLeft = TICKET_MAX_ATTEMPTS;
  const at = new Date().toISOString();
  const note = `Raspadito de Navidad, ticket ${code}`;
  let voucher: Voucher | null = null;
  if (ticket.outcome === "product" || ticket.outcome === "cash") {
    const { label, category, key } = ticket.prize;
    const cash = ticket.outcome === "cash";
    voucher = ticketVoucher(s, cash ? `${label} en efectivo` : label, category, cash ? label : "Gratis", note);
    const stock = t.stock.find((x) => x.key === key);
    if (stock) stock.left = Math.max(0, stock.left - 1);
    s.activity.unshift({ id: `a-tk-${code}`, type: "grant", occurredAt: at, title: `Ganaste en el raspadito: ${voucher.title.toLowerCase()}`, detail: "Guardado en tu Wallet", points: 0, category });
  } else if (ticket.outcome === "none") {
    t.entries += 1;
    s.activity.unshift({ id: `a-tk-${code}`, type: "grant", occurredAt: at, title: "Activaste un ticket del raspadito", detail: "Sumaste una participación en el sorteo", points: 0, category: null });
  }
  const secondChance = ticket.outcome === "none" ? drawSecondChance(s, code, at, ticket.chance) : null;
  t.collection += 1;
  let collectionVoucher: Voucher | null = null;
  if (t.collection >= TICKETS_PER_GIFT) {
    t.collection = 0;
    collectionVoucher = ticketVoucher(s, "Pan de jamón", "Panadería", "Gratis", `Regalo por ${TICKETS_PER_GIFT} tickets del raspadito`);
    s.activity.unshift({ id: `a-tkc-${code}`, type: "grant", occurredAt: at, title: "Completaste tu colección del raspadito", detail: "Te regalamos un pan de jamón", points: 0, category: "Panadería" });
  }
  return {
    code,
    lot: ticket.lot,
    outcome: ticket.outcome,
    prize: ticket.outcome === "none" ? null : { label: ticket.prize.label, category: ticket.prize.category },
    voucher,
    claimed: ticket.outcome === "claimed" ? ticket.claimed : null,
    secondChance,
    collectionVoucher,
    promo: buildTicketPromo(s),
  };
}

/** Sorteo local de la segunda oportunidad (en producción lo hace el servidor al activar). */
function drawSecondChance(s: MockStore, code: string, at: string, forced?: boolean): TicketSecondChance {
  if (!(forced ?? Math.random() < SECOND_CHANCE_ODDS)) return { won: false, virtualCode: null, prize: null, voucher: null };
  const total = SECOND_CHANCE_POOL.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  const pick = SECOND_CHANCE_POOL.find((p) => (roll -= p.weight) < 0) ?? SECOND_CHANCE_POOL[0];
  const virtualCode = `BC-${randomCode().replace("-", "")}`;
  let voucher: Voucher | null = null;
  if (pick.points) {
    s.balance += pick.points;
    s.lifetime += pick.points;
    s.activity.unshift({ id: `a-tkv-${code}`, type: "grant", occurredAt: at, title: "Ganaste con tu ticket virtual BC", detail: "Segunda oportunidad del raspadito", points: pick.points, category: null });
  } else {
    voucher = ticketVoucher(s, pick.label, pick.category ?? "Panadería", "Gratis", `Ticket virtual ${virtualCode}`);
    s.activity.unshift({ id: `a-tkv-${code}`, type: "grant", occurredAt: at, title: `Ganaste con tu ticket virtual BC: ${pick.label.toLowerCase()}`, detail: "Guardado en tu Wallet", points: 0, category: pick.category });
  }
  return { won: true, virtualCode, prize: { label: pick.label, category: pick.category, points: pick.points ?? null }, voucher };
}

const delay = <T,>(value: T, ms = 220) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

// ---------------------------------------------------------------------------
// Interfaz común de los adaptadores (la usa el provider de mi-club)
// ---------------------------------------------------------------------------

export type ClubDemoActions = {
  tierUp: () => boolean;
  complaintGift: () => Voucher | null;
  toggleVisits: () => number;
  /** Suma una compra elegible; devuelve las tiradas ganadas con ella (0 o 1). */
  purchase: () => number;
  /** Simula que Instagram validó el comentario con el código. Devuelve la campaña premiada. */
  socialComment: () => SocialCampaign | null;
};

export interface ClubAdapter {
  getCard(): Promise<ClubCard>;
  listDesigns(): Promise<CardDesign[]>;
  selectDesign(designId: string): Promise<ClubCard>;
  listVouchers(): Promise<Voucher[]>;
  listRewards(): Promise<ClubReward[]>;
  redeemReward(rewardId: string): Promise<Voucher>;
  getActivity(): Promise<ClubActivity>;
  getSpins(): Promise<SpinState>;
  /** Una tirada. Misma `idempotencyKey` → la misma tirada, sin descontar otra. */
  spin(idempotencyKey: string): Promise<SpinResult>;
  /** Campañas de Instagram vigentes y las que el socio empezó hace poco. */
  listSocialCampaigns(): Promise<SocialCampaign[]>;
  /** Código personal para la campaña. Idempotente: siempre el mismo. */
  requestSocialCode(campaignId: string): Promise<SocialCampaignCode>;
  /** Últimas publicaciones de Instagram; vacío si el backend no tiene conexión. */
  listInstagramFeed(): Promise<InstagramPost[]>;
  /** Raspadito de Navidad: colección, sorteo, intentos y premios que quedan. */
  getTicketPromo(): Promise<TicketPromo>;
  /** Activa el código que el socio raspó en su ticket. */
  activateTicket(code: string): Promise<TicketActivation>;
  /** Solo el adaptador mock: simula lo que en producción dispara el backend. */
  demo: ClubDemoActions | null;
}

export function createLiveClubAdapter(authed: AuthedRequest): ClubAdapter {
  return {
    getCard: () => authed((t) => request<ClubCardDto>("/loyalty/me/card", t)).then(mapCard),
    listDesigns: () => authed((t) => request<CardDesign[]>("/loyalty/me/card-designs", t)),
    selectDesign: (designId) =>
      authed((t) =>
        request<ClubCardDto>("/loyalty/me/card-design", t, { method: "PUT", body: JSON.stringify({ designId }) }),
      ).then(mapCard),
    listVouchers: () => authed((t) => request<Voucher[]>("/loyalty/me/vouchers", t)),
    listRewards: () => authed((t) => request<MemberRewardsDto>("/loyalty/me/rewards", t)).then(mapRewards),
    redeemReward: (rewardId) =>
      authed((t) =>
        request<RedemptionWithVoucherDto>("/loyalty/me/redemptions", t, {
          method: "POST",
          body: JSON.stringify({ rewardId }),
        }),
      ).then((r) => r.voucher),
    getActivity: () => authed((t) => request<ClubActivity>("/loyalty/me/timeline", t)),
    getSpins: () => authed((t) => request<SpinState>("/loyalty/me/spins", t)),
    spin: (idempotencyKey) =>
      authed((t) =>
        request<SpinResult>("/loyalty/me/spins", t, { method: "POST", headers: { "Idempotency-Key": idempotencyKey } }),
      ),
    listSocialCampaigns: () => authed((t) => request<SocialCampaign[]>("/loyalty/me/social-campaigns", t)),
    requestSocialCode: (campaignId) =>
      authed((t) =>
        request<SocialCampaignCode>(`/loyalty/me/social-campaigns/${encodeURIComponent(campaignId)}/code`, t, {
          method: "POST",
        }),
      ),
    listInstagramFeed: () => authed((t) => request<InstagramPost[]>("/loyalty/me/social-campaigns/feed", t)),
    // shortcut: bodega-api aún no tiene el raspadito; sin backend la tarjeta y la pantalla no aparecen. Cablear al publicar su spec.
    getTicketPromo: () => Promise.reject(new ClubApiError("El raspadito aún no está disponible.", 404)),
    activateTicket: () => Promise.reject(new ClubApiError("El raspadito aún no está disponible.", 404)),
    demo: null,
  };
}

export function createMockClubAdapter(member: Member): ClubAdapter {
  const s = () => ensureStore(member);
  return {
    getCard: () => delay(buildCard(s())),
    listDesigns: () => delay(resolveDesigns(s())),
    async selectDesign(designId) {
      const store = s();
      const design = resolveDesigns(store).find((d) => d.id === designId);
      if (!design) throw new ClubApiError("Ese diseño ya no existe.", 404);
      if (!design.unlocked) throw new ClubApiError("Todavía no has ganado ese diseño.", 409);
      store.designId = designId;
      return delay(buildCard(store), 160);
    },
    listVouchers() {
      const store = s();
      const now = Date.now();
      store.vouchers.forEach((v) => {
        if (v.status === "active" && new Date(v.expiresAt).getTime() <= now) v.status = "expired";
      });
      return delay([...store.vouchers]);
    },
    listRewards: () => delay([...MOCK_REWARDS]),
    async redeemReward(rewardId) {
      const store = s();
      const reward = MOCK_REWARDS.find((r) => r.id === rewardId);
      if (!reward) throw new ClubApiError("Esa recompensa ya no está disponible.", 404);
      if (store.balance < reward.points) {
        throw new ClubApiError(`Te faltan ${reward.points - store.balance} pts para este canje.`, 409);
      }
      store.balance -= reward.points;
      const code = randomCode();
      const voucher: Voucher = {
        id: `v-${code}`, origin: "redemption", grantReason: null, kind: "product", title: reward.name,
        valueLabel: `${reward.points} pts`, category: reward.category, code, qrValue: `LBVCH:${code}`,
        expiresAt: new Date(Date.now() + DAY).toISOString(), status: "active", note: null, usedAt: null, usedAtBranch: null,
      };
      store.vouchers.unshift(voucher);
      store.activity.unshift({
        id: `a-${code}`, type: "redemption", occurredAt: new Date().toISOString(),
        title: `Canjeaste: ${reward.name.toLowerCase()}`, detail: "Guardado en tu Wallet", points: -reward.points,
        category: reward.category,
      });
      return delay(voucher, 380);
    },
    getActivity: () => delay(buildActivity(s())),
    getSpins: () => delay(buildSpinState(s())),
    async spin(idempotencyKey) {
      const store = s();
      // Mismo orden que el backend: el replay por clave va antes que el saldo.
      const replay = store.spins.byKey.get(idempotencyKey);
      if (replay) return delay({ ...replay, available: store.spins.available }, 600);
      if (store.spins.available < 1) {
        throw new ClubApiError("No tienes tiradas disponibles.", 409, "NO_SPINS_AVAILABLE");
      }
      const result = drawSpin(store);
      store.spins.byKey.set(idempotencyKey, result);
      // Latencia creíble: la rueda ya está girando mientras tanto.
      return delay(result, 600 + Math.random() * 500);
    },
    listSocialCampaigns: () => delay(s().social.map((c) => ({ ...c }))),
    async requestSocialCode(campaignId) {
      const campaign = s().social.find((c) => c.id === campaignId);
      if (!campaign) throw new ClubApiError("La campaña no existe.", 404);
      if (campaign.participationStatus === "closed") {
        throw new ClubApiError("Esta campaña ya no recibe participaciones.", 409);
      }
      if (!campaign.code) {
        campaign.code = `BC-${randomCode().replace("-", "")}`;
        campaign.participationStatus = "pending";
      }
      return delay({ campaignId, code: campaign.code, expiresAt: campaign.endsAt, participationStatus: campaign.participationStatus }, 320);
    },
    listInstagramFeed: () => delay(DEMO_INSTAGRAM, 700),
    getTicketPromo: () => delay(buildTicketPromo(s())),
    async activateTicket(code) {
      // Misma latencia con o sin código válido.
      await delay(null, 650);
      return activateDemoTicket(s(), code);
    },
    demo: {
      tierUp: () => demoTierUp(member),
      complaintGift: () => demoComplaintGift(member),
      toggleVisits: () => demoToggleVisits(member),
      purchase: () => demoPurchase(member),
      socialComment: () => demoSocialComment(member),
    },
  };
}
// ---------------------------------------------------------------------------
// Demo (/club-mock): socia de ejemplo y eventos que en producción dispara el
// backend (subida de nivel, compensación de una queja, visitas).
// ---------------------------------------------------------------------------

export const DEMO_MEMBER: Member = {
  id: "demo",
  firstName: "Daniela",
  fullName: "Daniela Marcano",
  username: "dani.marcano",
  nationality: "V",
  ciDigits: "21304877",
  cedula: "V-21.304.877",
  memberNo: "BC 0048 12",
  whatsapp: "+58 414 555 0192",
  email: "daniela.marcano@correo.com",
  birthday: null,
  homeBranchId: null,
  preferences: [],
  acceptsMarketing: true,
  memberSince: "marzo 2025",
  tier: { name: "Plata", minLifetimePoints: 400, benefits: [] },
  points: { balance: 340, lifetime: 820 },
  referralCode: "DEMO12345678",
  profileCompletionPoints: 10,
  notificationPreferences: { whatsapp: true, email: false, offers: true },
  avatarUrl: null,
};

/** Sube al socio al siguiente nivel y emite el regalo del nivel. Solo mock. */
function demoTierUp(member: Member | null): boolean {
  const s = ensureStore(member);
  const next = TIERS[tierFor(s.lifetime).rank + 1];
  if (!next) return false;
  s.lifetime = next.minLifetimePoints + 30;
  if (next.perk) {
    const code = randomCode();
    s.vouchers.unshift({
      id: `v-${code}`, origin: "grant", grantReason: "tier_up", kind: /\d+%/.test(next.perk) ? "percent" : "product",
      title: next.perk, valueLabel: next.perk.match(/\d+%/)?.[0] ?? "Gratis", category: null, code, qrValue: `LBVCH:${code}`,
      expiresAt: new Date(Date.now() + 14 * DAY).toISOString(), status: "active", note: `Regalo por subir a ${next.name}`, usedAt: null, usedAtBranch: null,
    });
    s.activity.unshift({ id: `a-${code}`, type: "grant", occurredAt: new Date().toISOString(), title: `Subiste a ${next.name}`, detail: `Te regalamos: ${next.perk.toLowerCase()}`, points: 0, category: null });
  }
  return true;
}

let demoCase = 43;
/** Simula la compensación de una queja desde feedback-web. Solo mock. */
function demoComplaintGift(member: Member | null): Voucher | null {
  const s = ensureStore(member);
  const caseNo = `Q-00${demoCase++}`;
  const code = randomCode();
  const voucher: Voucher = {
    id: `v-${code}`, origin: "grant", grantReason: "complaint", kind: "product", title: "Postre de la casa", valueLabel: "Gratis",
    category: "Postres", code, qrValue: `LBVCH:${code}`, expiresAt: new Date(Date.now() + 14 * DAY).toISOString(), status: "active",
    note: `Por tu caso ${caseNo}`, usedAt: null, usedAtBranch: null,
  };
  s.vouchers.unshift(voucher);
  s.activity.unshift({ id: `a-${code}`, type: "grant", occurredAt: new Date().toISOString(), title: "Te regalamos un postre", detail: `Por tu caso ${caseNo}`, points: 0, category: "Postres" });
  return voucher;
}

/** Alterna 7 ↔ 10 visitas para probar el diseño Confluencia. Solo mock. */
function demoToggleVisits(member: Member | null): number {
  const s = ensureStore(member);
  s.visits = s.visits >= 10 ? 7 : 10;
  if (s.visits < 10 && s.designId === "confluencia") s.designId = "clasica";
  return s.visits;
}

const DEMO_INSTAGRAM: InstagramPost[] = [
  ["Pan de jamón recién salido, como cada diciembre pero todo el año.", "IMAGE", "/bodega-club/hero-bodega-club.webp"],
  ["Así se arma un cachito: masa, jamón y paciencia.", "VIDEO", "/club/texturas/masa.webp"],
  ["Golfeados con papelón y queso. Pasa temprano que vuelan.", "CAROUSEL_ALBUM", "/bodega-club/recompensas-bodega-club.webp"],
  ["El horno no descansa: canillas cada hora desde las 6:00 a.m.", "IMAGE", "/club/texturas/horno.webp"],
  ["Gracias por llenar la panadería este fin de semana.", "IMAGE", "/bodega-club/comunidad-bodega-club.webp"],
  ["Trigo, agua, sal y tiempo. Nada más.", "CAROUSEL_ALBUM", "/club/texturas/trigo.webp"],
].map(([caption, mediaType, thumbnailUrl], i) => ({
  id: `ig-demo-${i}`,
  permalink: "https://www.instagram.com/",
  caption,
  mediaType,
  thumbnailUrl,
  timestamp: new Date(Date.now() - (i * 2 + 1) * DAY).toISOString(),
}));

/** Simula el webhook de Instagram: acredita la campaña con código pendiente. Solo mock. */
function demoSocialComment(member: Member | null): SocialCampaign | null {
  const s = ensureStore(member);
  const campaign = s.social.find((c) => c.participationStatus === "pending");
  if (!campaign) return null;
  const now = new Date().toISOString();
  campaign.participationStatus = "completed";
  campaign.completedAt = now;
  s.balance += campaign.points;
  s.lifetime += campaign.points;
  s.activity.unshift({ id: `a-social-${campaign.id}`, type: "social", occurredAt: now, title: "Ganaste puntos en Instagram", detail: campaign.title, points: campaign.points, category: null });
  return { ...campaign };
}

/** Suma una compra elegible; cada 3 se gana una tirada. Solo mock. */
function demoPurchase(member: Member | null): number {
  const s = ensureStore(member);
  s.spins.pending += 1;
  if (s.spins.pending < PURCHASES_PER_SPIN) return 0;
  s.spins.pending = 0;
  s.spins.available += 1;
  return 1;
}
