// La Bodega — cliente del módulo de pedidos (delivery / retiro) de la-bodega-api
// (spec 071, endpoints públicos `/storefront/*`). Único punto de contacto con el
// backend desde el storefront: si cambian los endpoints, se toca solo este archivo.
//
// El servidor es la fuente de verdad de precios, agotados, delivery y tasa: el
// total que se muestra aquí es una vista previa; el que vale es el que devuelve
// `createOrder`.

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://app.bod-service.cloud/api";

export type Store = {
  id: string;
  name: string;
  address: string;
  /** Solo dígitos, con código de país. */
  whatsapp: string;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
};

export type Category = { id: string; name: string };

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  /** Precio en USD. */
  price: number;
  /** URL absoluta de la foto; vacío si no tiene. */
  image: string;
  /** Se muestra, pero no se puede pedir. */
  soldOut: boolean;
};

export type DeliveryZone = { id: string; name: string; /** USD */ price: number };

export type PaymentAccount = { bank: string; bankCode: string; phone: string; rif: string; holder: string };

export type PaymentInfo = {
  /** Cuenta de pago móvil activa del local; null si no tiene. */
  account: PaymentAccount | null;
  /** Bs por 1 USD. */
  rate: number;
  /** WhatsApp del local, solo dígitos con código de país. */
  whatsapp: string;
};

export type OrderInput = {
  storeId: string;
  mode: "delivery" | "pickup";
  customerName: string;
  customerPhone: string;
  zoneId?: string;
  address?: string;
  paymentReference?: string;
  items: { productId: string; quantity: number; note?: string }[];
};

export type CreatedOrder = {
  id: string;
  /** Código legible, `P-000123`. */
  code: string;
  subtotalUsd: number;
  deliveryFeeUsd: number;
  totalUsd: number;
  totalBs: number;
  rate: number;
};

/** Error de la API con su status, para distinguir "se agotó" (409) de una caída. */
export class PedidosApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "PedidosApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const raw = body && typeof body === "object" && "message" in body ? (body as { message: unknown }).message : null;
    const message = Array.isArray(raw) ? raw.join(". ") : raw ? String(raw) : `Error ${response.status}`;
    throw new PedidosApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export function fetchStores(): Promise<Store[]> {
  return request<Store[]>("/storefront/stores");
}

type ApiCatalog = {
  categories: Category[];
  products: { id: string; categoryId: string; name: string; description: string; priceUsd: number; imageUrl: string | null; soldOut: boolean }[];
};

export async function fetchCatalog(storeId: string): Promise<{ categories: Category[]; products: Product[] }> {
  const catalog = await request<ApiCatalog>(`/storefront/stores/${storeId}/catalog`);
  return {
    categories: catalog.categories,
    products: catalog.products.map((p) => ({
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description,
      price: p.priceUsd,
      image: p.imageUrl ?? "",
      soldOut: p.soldOut,
    })),
  };
}

export async function fetchDeliveryZones(storeId: string): Promise<DeliveryZone[]> {
  const zones = await request<{ id: string; name: string; priceUsd: number }[]>(`/storefront/stores/${storeId}/delivery-zones`);
  return zones.map((zone) => ({ id: zone.id, name: zone.name, price: zone.priceUsd }));
}

export async function fetchPaymentInfo(storeId: string): Promise<PaymentInfo> {
  const info = await request<PaymentInfo & { rateDate: string }>(`/storefront/stores/${storeId}/payment-info`);
  return { account: info.account, rate: info.rate, whatsapp: info.whatsapp };
}

export function createOrder(input: OrderInput): Promise<CreatedOrder> {
  return request<CreatedOrder>("/storefront/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
