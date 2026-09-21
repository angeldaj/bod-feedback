// Adapter de la API de Bodega Club (la-bodega-api, módulo loyalty, specs
// 069-club-loyalty y 070-club-engagement-encuesta). Espejo de
// `feedback-api.ts`: único punto de contacto con los endpoints del club desde
// la landing. Si cambia el contrato, se toca solo este archivo.
//
// El backend expone estos endpoints bajo `/loyalty/*` con sesión Bearer (no
// cookie): la landing (labodega.com) es cross-site respecto a la API, así que
// la cookie de terceros es frágil (ver 069 §"Decisiones de diseño").
//
// IMPORTANTE — contrato asumido: al escribir esto, `bodega-api/openapi.json`
// todavía no incluía el módulo `loyalty` (se está regenerando en paralelo).
// Las formas de request/response de abajo están tomadas de
// `bodega-api/specs/069-club-loyalty/plan.md` y
// `bodega-api/specs/070-club-engagement-encuesta/plan.md` (modelo Prisma +
// tabla de endpoints), en camelCase como el resto del repo (ver
// `feedback-api.ts`). Hay que reconciliar los DTOs exactos contra el
// `openapi.json` final del backend.

import type { ClubEvent, PointsPoint, Purchase, Reward } from "@/components/mi-club/data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://app.bod-service.cloud/api";

export class LoyaltyApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "LoyaltyApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Error ${response.status}`;
    throw new LoyaltyApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function jsonInit(method: string, body?: unknown, accessToken?: string): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
}

function authedGet(accessToken: string): RequestInit {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

// ---------------------------------------------------------------------------
// Tipos de cara a la UI (ES). La traducción con los DTO del backend (EN, ver
// más abajo) vive solo en este archivo.
// ---------------------------------------------------------------------------

export type MemberTier = {
  name: string;
  minLifetimePoints: number;
  benefits: string[];
};

export type NotificationPreferences = {
  whatsapp: boolean;
  email: boolean;
  offers: boolean;
};

export type Member = {
  id: string;
  firstName: string;
  fullName: string;
  username: string | null;
  nationality: "V" | "E";
  ciDigits: string;
  cedula: string; // formateada: "V-18.402.551"
  memberNo: string;
  whatsapp: string;
  email: string;
  birthday: string | null; // YYYY-MM-DD
  homeBranchId: string | null;
  preferences: string[];
  acceptsMarketing: boolean;
  memberSince: string; // etiqueta: "Marzo 2025"
  tier: MemberTier | null;
  points: { balance: number; lifetime: number };
  notificationPreferences: NotificationPreferences;
};

export type RegisterPayload = {
  nationality: "V" | "E";
  cedula: string; // solo dígitos
  name: string;
  whatsapp: string;
  email: string;
  password: string;
  username?: string;
  birthday?: string;
  homeBranchId?: string;
  preferences: string[];
  acceptsMarketing: boolean;
};

export type RegisterResult = {
  accessToken: string;
  refreshToken: string;
  member: Member;
  welcomeBonus: number;
};

export type AuthTokens = { accessToken: string; refreshToken: string };

export type UpdateMemberPayload = Partial<{
  name: string;
  username: string;
  whatsapp: string;
  email: string;
  birthday: string;
  homeBranchId: string;
  preferences: string[];
  acceptsMarketing: boolean;
}>;

export type PointsMovementType =
  | "welcome_bonus"
  | "earn"
  | "redeem"
  | "adjust"
  | "expire"
  | "survey";

export type PointsMovement = {
  id: string;
  type: PointsMovementType;
  points: number;
  occurredAt: string;
  reason: string | null;
  saleId: number | null;
};

export type Activity = {
  balance: number;
  lifetime: number;
  movements: PointsMovement[];
  purchases: Purchase[];
};

export type Redemption = {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  code: string;
  status: "pending" | "confirmed" | "cancelled" | "expired";
  expiresAt: string;
  confirmedAt: string | null;
};

export type MemberNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type MemberQr = { value: string; memberNo: string };

// ---------------------------------------------------------------------------
// DTOs asumidos del backend (EN, camelCase — ver nota de contrato arriba).
// ---------------------------------------------------------------------------

type MemberDto = {
  id: string;
  nationality: "V" | "E";
  ci: number | string;
  name: string;
  whatsapp: string;
  email: string;
  username: string | null;
  birthday: string | null;
  homeBranchId: string | null;
  preferences: string[];
  acceptsMarketing: boolean;
  memberNo: string;
  createdAt: string;
  tier: MemberTier | null;
  points: { balance: number; lifetime: number };
  notifyWhatsapp?: boolean;
  notifyEmail?: boolean;
  notifyOffers?: boolean;
};

type PointsEntryDto = {
  id: string;
  type: PointsMovementType;
  points: number;
  occurredAt: string;
  reason: string | null;
  saleId: number | null;
};

type MemberPurchaseLineDto = {
  productName?: string;
  channelHint?: string;
  quantity?: number;
};

type MemberPurchaseDto = {
  id: string;
  saleId: number;
  soldAt: string;
  branchId: number | string | null;
  branchName: string | null;
  totalUsd: number | string;
  totalBs: number | string;
  lines?: MemberPurchaseLineDto[] | null;
};

type ActivityDto = {
  balance: number;
  lifetime: number;
  movements: PointsEntryDto[];
  purchases: MemberPurchaseDto[];
};

type RewardDto = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  category: string | null;
  imageUrl: string | null;
  active: boolean;
  affordable?: boolean;
  missingPoints?: number;
};

type RedemptionDto = {
  id: string;
  rewardId: string;
  rewardName?: string;
  pointsCost: number;
  code: string;
  status: Redemption["status"];
  expiresAt: string;
  confirmedAt: string | null;
};

type ClubEventDto = {
  id: string;
  kind: ClubEvent["kind"];
  tag: string;
  title: string;
  whenLabel: string;
  description: string;
  official: boolean;
  active: boolean;
};

type NotificationDto = {
  id: string;
  kind: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Mapeo DTO (backend) → tipos de UI
// ---------------------------------------------------------------------------

function formatCedula(nationality: "V" | "E", ci: string): string {
  const grouped = ci.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${nationality}-${grouped}`;
}

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const label = date.toLocaleDateString("es-VE", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function mapMember(dto: MemberDto): Member {
  const ciDigits = String(dto.ci);
  const fullName = dto.name;
  return {
    id: dto.id,
    firstName: fullName.split(" ")[0] ?? fullName,
    fullName,
    username: dto.username,
    nationality: dto.nationality,
    ciDigits,
    cedula: formatCedula(dto.nationality, ciDigits),
    memberNo: dto.memberNo,
    whatsapp: dto.whatsapp,
    email: dto.email,
    birthday: dto.birthday,
    homeBranchId: dto.homeBranchId,
    preferences: dto.preferences ?? [],
    acceptsMarketing: dto.acceptsMarketing,
    memberSince: formatMemberSince(dto.createdAt),
    tier: dto.tier,
    points: dto.points,
    notificationPreferences: {
      whatsapp: dto.notifyWhatsapp ?? true,
      email: dto.notifyEmail ?? false,
      offers: dto.notifyOffers ?? true,
    },
  };
}

const CHANNEL_HINT_MAP: Record<string, Purchase["channel"]> = {
  mesa: "Mesa",
  dine_in: "Mesa",
  table: "Mesa",
  para_llevar: "Para llevar",
  takeaway: "Para llevar",
  delivery: "Delivery",
  panaderia: "Panadería",
  bakery: "Panadería",
};

function purchaseChannel(lines: MemberPurchaseLineDto[] | null | undefined): Purchase["channel"] {
  const hint = lines?.[0]?.channelHint?.toLowerCase();
  if (hint && CHANNEL_HINT_MAP[hint]) return CHANNEL_HINT_MAP[hint];
  return "Mesa";
}

function purchaseSummary(lines: MemberPurchaseLineDto[] | null | undefined): string {
  const names = (lines ?? [])
    .map((line) => line.productName)
    .filter((name): name is string => Boolean(name));
  if (!names.length) return "Compra en La Bodega";
  return names.slice(0, 2).join(" + ");
}

function mapPurchase(dto: MemberPurchaseDto, pointsBySale: Map<number, number>): Purchase {
  const date = new Date(dto.soldAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
  return {
    dateLabel,
    date: dto.soldAt,
    branch: dto.branchName ?? "La Bodega",
    channel: purchaseChannel(dto.lines),
    summary: purchaseSummary(dto.lines),
    amount: Number(dto.totalUsd) || 0,
    points: pointsBySale.get(dto.saleId) ?? 0,
  };
}

function mapActivity(dto: ActivityDto): Activity {
  const pointsBySale = new Map<number, number>();
  for (const movement of dto.movements) {
    if (movement.saleId != null && movement.points > 0) {
      pointsBySale.set(movement.saleId, (pointsBySale.get(movement.saleId) ?? 0) + movement.points);
    }
  }
  return {
    balance: dto.balance,
    lifetime: dto.lifetime,
    movements: dto.movements.map((m) => ({
      id: m.id,
      type: m.type,
      points: m.points,
      occurredAt: m.occurredAt,
      reason: m.reason,
      saleId: m.saleId,
    })),
    purchases: dto.purchases
      .map((p) => mapPurchase(p, pointsBySale))
      .sort((a, b) => (a.date < b.date ? 1 : -1)),
  };
}

function mapReward(dto: RewardDto, balance: number): Reward {
  return {
    id: dto.id,
    name: dto.name,
    points: dto.pointsCost,
    category: dto.category ?? "Especial",
    note: dto.description ?? "",
    image: dto.imageUrl ?? "",
    active: dto.active,
    affordable: dto.affordable ?? balance >= dto.pointsCost,
  };
}

function mapRedemption(dto: RedemptionDto): Redemption {
  return {
    id: dto.id,
    rewardId: dto.rewardId,
    rewardName: dto.rewardName ?? "",
    pointsCost: dto.pointsCost,
    code: dto.code,
    status: dto.status,
    expiresAt: dto.expiresAt,
    confirmedAt: dto.confirmedAt,
  };
}

function mapEvent(dto: ClubEventDto): ClubEvent {
  return {
    kind: dto.kind,
    tag: dto.tag,
    title: dto.title,
    when: dto.whenLabel,
    description: dto.description,
    official: dto.official,
  };
}

function mapNotification(dto: NotificationDto): MemberNotification {
  return dto;
}

// ---------------------------------------------------------------------------
// Auth y registro
// ---------------------------------------------------------------------------

export async function register(payload: RegisterPayload): Promise<RegisterResult> {
  const homeBranchId = payload.homeBranchId;
  const body = {
    nationality: payload.nationality,
    ci: payload.cedula,
    name: payload.name,
    whatsapp: payload.whatsapp,
    email: payload.email,
    password: payload.password,
    username: payload.username || undefined,
    birthday: payload.birthday || undefined,
    homeBranchId: homeBranchId || undefined,
    preferences: payload.preferences,
    acceptsMarketing: payload.acceptsMarketing,
  };
  const dto = await request<{
    accessToken: string;
    refreshToken: string;
    member: MemberDto;
    welcomeBonus?: number;
  }>("/loyalty/register", jsonInit("POST", body));
  const member = mapMember(dto.member);
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    member,
    welcomeBonus: dto.welcomeBonus ?? member.points.balance,
  };
}

export async function login(identifier: string, password: string): Promise<AuthTokens> {
  return request<AuthTokens>("/loyalty/auth/login", jsonInit("POST", { identifier, password }));
}

export async function refreshSession(refreshToken: string): Promise<AuthTokens> {
  return request<AuthTokens>("/loyalty/auth/refresh", jsonInit("POST", { refreshToken }));
}

export async function logout(refreshToken: string): Promise<void> {
  await request<void>("/loyalty/auth/logout", jsonInit("POST", { refreshToken }));
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request<void>("/loyalty/auth/password-reset/request", jsonInit("POST", { email }));
}

export async function confirmPasswordReset(token: string, password: string): Promise<void> {
  await request<void>(
    "/loyalty/auth/password-reset/confirm",
    jsonInit("POST", { token, password }),
  );
}

// ---------------------------------------------------------------------------
// Perfil y actividad (requieren access token)
// ---------------------------------------------------------------------------

export async function getMe(accessToken: string): Promise<Member> {
  const dto = await request<MemberDto>("/loyalty/me", authedGet(accessToken));
  return mapMember(dto);
}

export async function updateMe(accessToken: string, patch: UpdateMemberPayload): Promise<Member> {
  const dto = await request<MemberDto>("/loyalty/me", jsonInit("PATCH", patch, accessToken));
  return mapMember(dto);
}

export async function getActivity(accessToken: string): Promise<Activity> {
  const dto = await request<ActivityDto>("/loyalty/me/activity", authedGet(accessToken));
  return mapActivity(dto);
}

export async function getRewards(accessToken: string): Promise<Reward[]> {
  const [dtos, me] = await Promise.all([
    request<RewardDto[]>("/loyalty/me/rewards", authedGet(accessToken)),
    getMe(accessToken),
  ]);
  return dtos.filter((d) => d.active).map((d) => mapReward(d, me.points.balance));
}

export async function requestRedemption(accessToken: string, rewardId: string): Promise<Redemption> {
  const dto = await request<RedemptionDto>(
    "/loyalty/me/redemptions",
    jsonInit("POST", { rewardId }, accessToken),
  );
  return mapRedemption(dto);
}

export async function listRedemptions(accessToken: string): Promise<Redemption[]> {
  const dtos = await request<RedemptionDto[]>("/loyalty/me/redemptions", authedGet(accessToken));
  return dtos.map(mapRedemption);
}

export async function getQr(accessToken: string): Promise<MemberQr> {
  return request<MemberQr>("/loyalty/me/qr", authedGet(accessToken));
}

export async function getEvents(accessToken: string): Promise<ClubEvent[]> {
  const dtos = await request<ClubEventDto[]>("/loyalty/events", authedGet(accessToken));
  return dtos.filter((d) => d.active).map(mapEvent);
}

export async function getNotifications(accessToken: string): Promise<MemberNotification[]> {
  const dtos = await request<NotificationDto[]>("/loyalty/me/notifications", authedGet(accessToken));
  return dtos.map(mapNotification);
}

export async function markNotificationRead(accessToken: string, id: string): Promise<void> {
  await request<void>(`/loyalty/me/notifications/${id}/read`, jsonInit("POST", undefined, accessToken));
}

export async function updateNotificationPreferences(
  accessToken: string,
  prefs: Partial<NotificationPreferences>,
): Promise<void> {
  await request<void>(
    "/loyalty/me/notification-preferences",
    jsonInit(
      "PATCH",
      {
        notifyWhatsapp: prefs.whatsapp,
        notifyEmail: prefs.email,
        notifyOffers: prefs.offers,
      },
      accessToken,
    ),
  );
}

export type { PointsPoint };
