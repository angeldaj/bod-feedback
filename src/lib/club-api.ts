// Adapter de Bodega Club v2 (mi-club): tarjeta con piel por nivel, diseños de
// tarjeta, Bodega Wallet de vouchers, catálogo de canje y actividad.
//
// Contrato: spec 075 de bodega-api (`GET /loyalty/me/card`, `/me/card-designs`,
// `PUT /me/card-design`, `/me/vouchers`, `/me/rewards`, `POST /me/redemptions`,
// `/me/timeline`). Dos adaptadores con la misma interfaz:
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

export type VoucherOrigin = "redemption" | "grant";
export type GrantReason = "manual" | "segment" | "complaint" | "tier_up";
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
      type: "redemption" | "grant";
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

export class ClubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ClubApiError";
    this.status = status;
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
    throw new ClubApiError(message, response.status);
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

const delay = <T,>(value: T, ms = 220) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

// ---------------------------------------------------------------------------
// Interfaz común de los adaptadores (la usa el provider de mi-club)
// ---------------------------------------------------------------------------

export type ClubDemoActions = {
  tierUp: () => boolean;
  complaintGift: () => Voucher | null;
  toggleVisits: () => number;
};

export interface ClubAdapter {
  getCard(): Promise<ClubCard>;
  listDesigns(): Promise<CardDesign[]>;
  selectDesign(designId: string): Promise<ClubCard>;
  listVouchers(): Promise<Voucher[]>;
  listRewards(): Promise<ClubReward[]>;
  redeemReward(rewardId: string): Promise<Voucher>;
  getActivity(): Promise<ClubActivity>;
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
    demo: {
      tierUp: () => demoTierUp(member),
      complaintGift: () => demoComplaintGift(member),
      toggleVisits: () => demoToggleVisits(member),
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
  notificationPreferences: { whatsapp: true, email: false, offers: true },
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
