// La Bodega — cliente de encargos de la-bodega-api (spec 075, endpoints públicos
// `/storefront/special-orders/*`). Un encargo nace sin precio: lo cotiza un
// asesor y el cliente responde desde el link con token.

import { request } from "@/lib/pedidos-api";

export type EncargoStatus =
  | "requested"
  | "quoted"
  | "accepted"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "rejected"
  | "expired"
  | "cancelled";

export type EncargoInput = {
  storeId: string;
  mode: "delivery" | "pickup";
  customerName: string;
  customerPhone: string;
  zoneId?: string;
  address?: string;
  /** Fecha y hora deseadas, ISO. */
  requestedFor: string;
  customerNote?: string;
  items: { productId: string; quantity: number; note?: string }[];
};

export type CreatedEncargo = {
  /** Código legible, `E-000123`. */
  code: string;
  /** Token del link de seguimiento. */
  token: string;
};

export type EncargoItem = {
  id: string;
  source: "catalog" | "custom";
  name: string;
  quantity: number;
  note: string | null;
  /** Null mientras no hay cotización. */
  unitPriceUsd: number | null;
  lineTotalUsd: number | null;
};

export type EncargoQuote = {
  subtotalUsd: number;
  deliveryFeeUsd: number;
  totalUsd: number;
  depositPercent: number;
  depositUsd: number;
  balanceUsd: number;
  advisorNote: string | null;
  quotedAt: string;
  validUntil: string;
};

export type EncargoBs = {
  rate: number;
  /** true si la tasa quedó congelada al aceptar; false si es la del día. */
  frozen: boolean;
  totalBs: number;
  depositBs: number;
  balanceBs: number;
};

export type Encargo = {
  code: string;
  status: EncargoStatus;
  storeName: string;
  /** Solo dígitos, con código de país. */
  storeWhatsapp: string;
  mode: "delivery" | "pickup";
  customerName: string;
  zoneName: string | null;
  address: string | null;
  requestedFor: string;
  scheduledFor: string | null;
  customerNote: string | null;
  customerResponseNote: string | null;
  cancelReason: string | null;
  items: EncargoItem[];
  quote: EncargoQuote | null;
  bs: EncargoBs | null;
  /** Cuenta a la que se paga el abono; null si no hay abono. */
  payment: { bank: string; phone: string; rif: string; holder: string } | null;
  depositReference: string | null;
  balancePaid: boolean;
  events: { status: EncargoStatus; at: string }[];
};

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const path = (token: string) => `/storefront/special-orders/${encodeURIComponent(token)}`;

export function createEncargo(input: EncargoInput): Promise<CreatedEncargo> {
  return request<CreatedEncargo>("/storefront/special-orders", json(input));
}

export function fetchEncargo(token: string): Promise<Encargo> {
  return request<Encargo>(path(token), { cache: "no-store" });
}

export function acceptEncargo(token: string, reference?: string): Promise<Encargo> {
  return request<Encargo>(`${path(token)}/accept`, json({ reference }));
}

export function requestEncargoChanges(token: string, note: string): Promise<Encargo> {
  return request<Encargo>(`${path(token)}/request-changes`, json({ note }));
}

export function rejectEncargo(token: string, note?: string): Promise<Encargo> {
  return request<Encargo>(`${path(token)}/reject`, json({ note }));
}
