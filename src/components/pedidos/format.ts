import type { CartItem } from "./use-cart";

const usd = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatUsd = (value: number) => `$${usd.format(value)}`;
export const formatBs = (value: number) => `Bs ${usd.format(value)}`;

export type OrderSummary = {
  /** Código que asigna el servidor al crear el pedido (`P-000123`). */
  code?: string;
  name: string;
  phone: string;
  mode: "delivery" | "retiro";
  zone?: { name: string; price: number };
  address?: string;
  /** Local del pedido: despacha el delivery o recibe el retiro. */
  store: { name: string; address: string };
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Total en Bs; si el servidor ya lo calculó, se usa ese. */
  totalBs: number;
  rate: number;
  reference: string;
};

/** Texto plano (con el formato *negrita* de WhatsApp) del pedido completo. */
export function buildWhatsappMessage(order: OrderSummary): string {
  const lines: string[] = [
    order.code ? `*Nuevo pedido ${order.code} — La Bodega*` : "*Nuevo pedido — La Bodega*",
    `Cliente: ${order.name} · ${order.phone}`,
  ];

  if (order.mode === "delivery" && order.zone) {
    lines.push(`Modalidad: Delivery — Zona: ${order.zone.name} (${formatUsd(order.zone.price)})`);
    lines.push(`Dirección: ${order.address ?? ""}`);
  } else {
    lines.push(`Modalidad: Retiro en local — ${order.store.name}${order.store.address ? ` (${order.store.address})` : ""}`);
  }

  lines.push("", "*Productos*");
  for (const item of order.items) {
    lines.push(`${item.quantity} × ${item.name} — ${formatUsd(item.price * item.quantity)}`);
    if (item.note.trim()) lines.push(`   Nota: ${item.note.trim()}`);
  }

  lines.push("", `Subtotal: ${formatUsd(order.subtotal)}`);
  if (order.mode === "delivery") lines.push(`Delivery: ${formatUsd(order.deliveryFee)}`);
  lines.push(
    `*Total: ${formatUsd(order.total)} · ${formatBs(order.totalBs)}* (tasa ${formatBs(order.rate)})`,
  );
  lines.push(`Pago Móvil — Ref: ${order.reference.trim() || "pendiente"}`);

  return lines.join("\n");
}

export function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
