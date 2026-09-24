// La Bodega — vocabulario del feedback v2 (encuesta + queja).
//
// Las CLAVES son espejo exacto de `bodega-api/src/feedback/domain/catalog.ts`
// (spec 071): al backend viajan claves, nunca etiquetas. Las etiquetas en
// español viven aquí porque la landing tiene su propio copy (p. ej. los
// aspectos cambian de nombre según el canal). Si el backend agrega o renombra
// una clave, se toca este archivo y `src/lib/feedback-api.ts`.

// ---- Canal y momento de la visita -----------------------------------------

export const CHANNELS = ["dine_in", "bakery", "takeaway", "delivery"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  dine_in: "Comí en el local",
  bakery: "Panadería / mostrador",
  takeaway: "Para llevar",
  delivery: "Delivery",
};

export const MOMENTS = ["breakfast", "lunch", "dinner"] as const;
export type Moment = (typeof MOMENTS)[number];

export const MOMENT_LABELS: Record<Moment, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
};

// ---- Aspectos por canal (paso 3 de la encuesta) ---------------------------

export const ASPECT_KEYS = [
  "food",
  "service",
  "ambiance",
  "waitTime",
  "packaging",
  "punctuality",
  "courier",
] as const;
export type AspectKey = (typeof ASPECT_KEYS)[number];

export type AspectDef = { key: AspectKey; label: string; hint: string };

/** Mismo orden y mismas claves que `ASPECTS_BY_CHANNEL` del backend. */
export const ASPECTS_BY_CHANNEL: Record<Channel, AspectDef[]> = {
  dine_in: [
    { key: "food", label: "La comida", hint: "Sabor, punto, temperatura" },
    { key: "service", label: "El servicio", hint: "Atención y trato del equipo" },
    { key: "ambiance", label: "El ambiente", hint: "Música, luz, limpieza" },
    { key: "waitTime", label: "El tiempo de espera", hint: "Desde que pediste hasta que llegó a la mesa" },
  ],
  bakery: [
    { key: "food", label: "El producto", hint: "Frescura y sabor" },
    { key: "service", label: "La atención", hint: "El trato en el mostrador" },
    { key: "waitTime", label: "La rapidez en caja", hint: "Cuánto esperaste para pagar" },
  ],
  takeaway: [
    { key: "food", label: "La comida", hint: "Sabor y cómo llegó a tus manos" },
    { key: "service", label: "La atención", hint: "El trato al pedir y al entregarte" },
    { key: "waitTime", label: "La rapidez", hint: "Cuánto tardó tu pedido" },
    { key: "packaging", label: "El empaque", hint: "Completo, bien cerrado, sin derrames" },
  ],
  delivery: [
    { key: "food", label: "La comida", hint: "Sabor y temperatura al llegar" },
    { key: "packaging", label: "El empaque", hint: "Completo, bien cerrado, sin derrames" },
    { key: "punctuality", label: "La puntualidad", hint: "Si llegó a la hora que te dijimos" },
    { key: "courier", label: "El repartidor", hint: "Trato y cuidado en la entrega" },
  ],
};

// ---- Temas: lo mejor / lo mejorable (paso 4 de la encuesta) ----------------

export const TOPICS = [
  "flavor",
  "service",
  "speed",
  "fair_price",
  "cleanliness",
  "ambiance",
] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<Topic, string> = {
  flavor: "Sabor",
  service: "Atención",
  speed: "Rapidez",
  fair_price: "Precio justo",
  cleanliness: "Limpieza",
  ambiance: "Ambiente",
};

// ---- Catálogo de la queja --------------------------------------------------

export const INCIDENT_GROUPS = ["health_safety", "charge_order", "service", "other"] as const;
export type IncidentGroup = (typeof INCIDENT_GROUPS)[number];

export const INCIDENT_CATEGORIES = [
  "spoiled_food",
  "foreign_object",
  "undercooked",
  "allergic_reaction",
  "hygiene",
  "accident",
  "wrong_charge",
  "wrong_order",
  "delivery",
  "staff_attitude",
  "long_wait",
  "cold_food",
  "facilities",
  "other",
] as const;
export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export type IncidentPriority = "urgent" | "high" | "medium";

/** Grupos visibles al cliente, en orden. La prioridad es invisible para él. */
export const INCIDENT_CATALOG: {
  group: IncidentGroup;
  label: string;
  priority: IncidentPriority;
  categories: { key: IncidentCategory; label: string }[];
}[] = [
  {
    group: "health_safety",
    label: "Salud y seguridad",
    priority: "urgent",
    categories: [
      { key: "spoiled_food", label: "Comida en mal estado" },
      { key: "foreign_object", label: "Objeto extraño / insecto" },
      { key: "undercooked", label: "Cruda o mal cocida" },
      { key: "allergic_reaction", label: "Reacción alérgica" },
      { key: "hygiene", label: "Higiene del local o del personal" },
      { key: "accident", label: "Accidente o lesión en el local" },
    ],
  },
  {
    group: "charge_order",
    label: "Cobro y pedido",
    priority: "high",
    categories: [
      { key: "wrong_charge", label: "Cobro incorrecto o doble" },
      { key: "wrong_order", label: "Pedido equivocado o incompleto" },
      { key: "delivery", label: "Delivery: no llegó, tarde o en mal estado" },
    ],
  },
  {
    group: "service",
    label: "Servicio",
    priority: "medium",
    categories: [
      { key: "staff_attitude", label: "Mal trato del personal" },
      { key: "long_wait", label: "Espera excesiva" },
      { key: "cold_food", label: "Llegó fría" },
      { key: "facilities", label: "Instalaciones (baños, aire, ruido, estacionamiento)" },
    ],
  },
  {
    group: "other",
    label: "Otro",
    priority: "medium",
    categories: [{ key: "other", label: "Otro" }],
  },
];

export const GROUP_OF_CATEGORY = Object.fromEntries(
  INCIDENT_CATALOG.flatMap((g) => g.categories.map((c) => [c.key, g.group])),
) as Record<IncidentCategory, IncidentGroup>;

/** Categorías que disparan el aviso del 911. */
export const EMERGENCY_CATEGORIES: readonly IncidentCategory[] = ["allergic_reaction", "accident"];

// ---- WhatsApp venezolano ---------------------------------------------------

/** Operadoras móviles aceptadas (mismo criterio que `ve-phone.ts` del backend). */
export const VE_MOBILE_OPERATORS = ["412", "414", "416", "422", "424", "426"];

/**
 * Reduce lo que escribió la persona a los 10 dígitos nacionales (`4141234567`).
 * Acepta `0414…`, `58414…`, `+58 414-…`. Devuelve lo que haya (puede estar
 * incompleto) para que el campo lo muestre formateado mientras se escribe.
 */
export function nationalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("58") && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** `4141234567` → `414 123 4567` (formato visible del campo). */
export function formatNational(digits: string): string {
  const d = digits.slice(0, 10);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join(" ");
}

/** E.164 (`+584141234567`) o `null` si no es un móvil venezolano válido. */
export function toE164(digits: string): string | null {
  if (digits.length !== 10) return null;
  if (!VE_MOBILE_OPERATORS.includes(digits.slice(0, 3))) return null;
  return `+58${digits}`;
}
