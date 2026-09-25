// La Bodega — datos de ejemplo para el panel de satisfacción.
//
// Todo se genera de forma DETERMINISTA (PRNG sembrado + fecha de referencia
// fija) para que el render del servidor y del cliente coincidan exactamente
// —sin desajustes de hidratación— y para que las cifras del panel no cambien
// entre recargas. No usar Date.now() ni Math.random() aquí.

// ---------------------------------------------------------------------------
// Vocabulario del panel de ejemplo (el de la encuesta v1). El dashboard real
// vive en bodega-soft-nx (feedback-web); esto solo alimenta /dashboard.
// ---------------------------------------------------------------------------

export type AspectKey = "comida" | "servicio" | "ambiente" | "tiempo";

export const ASPECTS: { key: AspectKey; label: string; hint: string }[] = [
  { key: "comida", label: "La comida", hint: "Sabor, punto, temperatura" },
  { key: "servicio", label: "El servicio", hint: "Atención y trato del equipo" },
  { key: "ambiente", label: "El ambiente", hint: "Música, luz, limpieza" },
  { key: "tiempo", label: "El tiempo de espera", hint: "Desde el pedido hasta la mesa" },
];

export const SUCURSALES = ["Bodega 1", "Bodega 2", "Bodega 3"] as const;
export const MOMENTOS = ["Desayuno", "Almuerzo", "Cena", "Para llevar"] as const;
export const TEMAS = [
  "Sabor",
  "Espera",
  "Atención",
  "Precio",
  "Limpieza",
  "Pedido equivocado",
  "Ruido",
  "Nada, todo bien",
] as const;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type SurveyResponse = {
  id: string;
  /** ISO 8601, hora local de la sala. */
  createdAt: string;
  overall: number; // 1..5
  sucursal: (typeof SUCURSALES)[number];
  momento: (typeof MOMENTOS)[number];
  aspects: Record<AspectKey, number>;
  temas: string[];
  comentario: string;
  nombre: string;
  contacto: string;
  /** true cuando la respuesta trae contacto y overall<=2: candidata a seguimiento. */
  resuelto: boolean;
};

// La "ahora" del panel. Fija a propósito (ver nota de determinismo arriba).
export const NOW = new Date("2026-09-12T21:40:00-04:00");

// ---------------------------------------------------------------------------
// PRNG sembrado (mulberry32) — mismo resultado en servidor y cliente.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x1a0d0e6a);

const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

/** Muestra ponderada: weights alineado con arr. */
function weighted<T>(arr: readonly T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

/** Entero en [min,max]. */
const int = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;

// ---------------------------------------------------------------------------
// Bancos de texto (español de Venezuela, tono de la casa).
// ---------------------------------------------------------------------------

const NOMBRES = [
  "María Fernández", "José Rodríguez", "Ana Golindano", "Luis Bracho",
  "Carmen Salazar", "Pedro Villarroel", "Génesis Marcano", "Rafael Guaimare",
  "Daniela Rondón", "Andrés Millán", "Valentina Ochoa", "Jesús Colmenares",
  "Gabriela Istúriz", "Ricardo Pérez", "Yohana Bermúdez", "Oscar Farías",
  "Patricia Guédez", "Emilio Sanabria", "Rosa Idrogo", "Miguel Ávila",
  "Karla Betancourt", "Alejandro Nieves", "", "", "", "", "",
];

const CONTACTOS = [
  "+58 414-8823901", "+58 424-5510237", "+58 412-7789043", "+58 416-3320981",
  "maria.f@gmail.com", "jrodriguez88@hotmail.com", "@danirondon", "@andresm_pzo",
  "+58 414-9012237", "gabi.isturiz@gmail.com", "+58 426-7781120",
];

const COMENTARIOS_ALTO = [
  "El pan recién horneado es otra cosa. Volveremos el domingo.",
  "La atención de la muchacha fue impecable, nos hizo sentir en casa.",
  "Pedí la sopa del día y estaba en su punto. Todo excelente.",
  "El ambiente de noche con la luz cálida es precioso. Gracias.",
  "Mejor cachito de Puerto Ordaz, sin discusión.",
  "Rápido, sabroso y el café espectacular. Nada que reprochar.",
  "Celebramos el cumpleaños de mi mamá y quedó feliz. Mil gracias.",
  "Todo perfecto como siempre. Ya somos clientes fijos.",
  "La cena estuvo deliciosa y el trato del mesonero de diez.",
  "",
  "",
  "",
];

const COMENTARIOS_MEDIO = [
  "La comida bien, pero tardaron un poco con la mesa del fondo.",
  "Rico todo, aunque la música estaba algo alta para conversar.",
  "Buen sabor. Ojalá tuvieran más opciones sin gluten.",
  "El servicio estuvo bien, el local un poco lleno ese día.",
  "Todo correcto, el postre podría estar más frío.",
  "Buena relación precio-calidad, volvería.",
  "",
  "",
];

const COMENTARIOS_BAJO = [
  "Esperamos casi 40 minutos por dos platos. No es la primera vez.",
  "Me trajeron el pedido equivocado y nadie se disculpó.",
  "La comida llegó fría y el mesonero estaba apurado, cortante.",
  "Cobraron un servicio que no consumimos, revisen la cuenta.",
  "El baño estaba sucio y eso corta el apetito, por favor cuiden eso.",
  "Muy ruidoso y demoraron demasiado. Salimos con mal sabor.",
  "Pedí término medio y llegó casi crudo. Lo devolví dos veces.",
  "El aire no servía y hacía un calor insoportable en el salón.",
];

// Temas por sentimiento (para que las quejas correlacionen con la nota).
const TEMAS_BAJO = ["Espera", "Atención", "Pedido equivocado", "Precio", "Limpieza", "Ruido", "Sabor"];
const TEMAS_ALTO = ["Nada, todo bien"];

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------

/** Nota de aspecto correlacionada con la general, con algo de ruido y techo/piso. */
function aspectFromOverall(overall: number, bias: number): number {
  const jitter = int(-1, 1) + bias;
  return Math.max(1, Math.min(5, overall + jitter));
}

// Peso relativo por sucursal (Bodega 2 rinde algo mejor; Bodega 3 es la nueva).
const SUC_WEIGHTS = [1, 1.15, 0.7];
// La casa va bien: la general se inclina a 4-5, con cola real de quejas.
const OVERALL_WEIGHTS = [5, 9, 16, 34, 36]; // notas 1..5

function makeResponse(index: number, dayOffset: number): SurveyResponse {
  const overall = weighted([1, 2, 3, 4, 5], OVERALL_WEIGHTS);
  const sucursal = weighted(SUCURSALES, SUC_WEIGHTS);
  const momento = weighted(MOMENTOS, [22, 30, 34, 14]);

  // Sesgos suaves por aspecto: el tiempo de espera es el punto flojo.
  const aspects = {
    comida: aspectFromOverall(overall, 0),
    servicio: aspectFromOverall(overall, 0),
    ambiente: aspectFromOverall(overall, 1),
    tiempo: aspectFromOverall(overall, -1),
  } as Record<AspectKey, number>;

  // Temas: en notas bajas aparecen quejas; en altas casi siempre "todo bien".
  let temas: string[] = [];
  if (overall <= 2) {
    const n = int(1, 3);
    const pool = [...TEMAS_BAJO];
    for (let i = 0; i < n && pool.length; i++) {
      temas.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    }
  } else if (overall === 3) {
    temas = rand() < 0.6 ? [pick(TEMAS_BAJO)] : [pick(TEMAS_ALTO)];
  } else {
    temas = rand() < 0.7 ? [pick(TEMAS_ALTO)] : [pick(TEMAS)];
  }

  const comentario =
    overall <= 2
      ? pick(COMENTARIOS_BAJO)
      : overall === 3
        ? pick(COMENTARIOS_MEDIO)
        : pick(COMENTARIOS_ALTO);

  // Contacto: más probable si dejó queja (quiere respuesta) o si le encantó.
  const wantsFollowUp = overall <= 2 && rand() < 0.72;
  const leavesContact = wantsFollowUp || rand() < 0.28;
  const nombre = leavesContact ? pick(NOMBRES.filter(Boolean)) : pick(NOMBRES);
  const contacto = leavesContact ? pick(CONTACTOS) : "";

  // Reparte la hora dentro del momento del día.
  const hourByMomento: Record<string, [number, number]> = {
    Desayuno: [7, 10],
    Almuerzo: [12, 15],
    Cena: [19, 22],
    "Para llevar": [8, 20],
  };
  const [h0, h1] = hourByMomento[momento];
  const d = new Date(NOW);
  d.setDate(d.getDate() - dayOffset);
  d.setHours(int(h0, h1), int(0, 59), 0, 0);

  // Algunas alertas ya fueron atendidas por el equipo.
  const resuelto = wantsFollowUp ? rand() < 0.45 : false;

  return {
    id: `LB-${String(4200 + index).padStart(4, "0")}`,
    createdAt: d.toISOString(),
    overall,
    sucursal,
    momento,
    aspects,
    temas,
    comentario,
    nombre,
    contacto,
    resuelto,
  };
}

function generate(): SurveyResponse[] {
  const out: SurveyResponse[] = [];
  const DAYS = 120;
  let index = 0;
  for (let day = DAYS - 1; day >= 0; day--) {
    // Volumen por día: fines de semana más movidos, ligera tendencia al alza.
    const dow = new Date(NOW.getTime() - day * 86400000).getDay();
    const weekend = dow === 5 || dow === 6 || dow === 0;
    const trend = 1 + (DAYS - day) / DAYS / 2.2; // crece con el tiempo
    const base = weekend ? int(6, 10) : int(2, 6);
    const count = Math.round(base * trend);
    for (let i = 0; i < count; i++) {
      out.push(makeResponse(index++, day));
    }
  }
  // Orden cronológico ascendente.
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const RESPONSES: SurveyResponse[] = generate();

// ---------------------------------------------------------------------------
// Rangos de fecha
// ---------------------------------------------------------------------------

export type RangeKey = "7d" | "30d" | "90d" | "all";

export const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7 días", days: 7 },
  { key: "30d", label: "30 días", days: 30 },
  { key: "90d", label: "90 días", days: 90 },
  { key: "all", label: "Todo", days: null },
];

export function filterByRange(
  rows: SurveyResponse[],
  range: RangeKey,
): SurveyResponse[] {
  const cfg = RANGES.find((r) => r.key === range);
  if (!cfg?.days) return rows;
  const cutoff = NOW.getTime() - cfg.days * 86400000;
  return rows.filter((r) => new Date(r.createdAt).getTime() >= cutoff);
}

export function filterBySucursal(
  rows: SurveyResponse[],
  sucursal: string | "all",
): SurveyResponse[] {
  if (sucursal === "all") return rows;
  return rows.filter((r) => r.sucursal === sucursal);
}

// ---------------------------------------------------------------------------
// Agregaciones (KPIs y series para las gráficas)
// ---------------------------------------------------------------------------

const round1 = (n: number) => Math.round(n * 10) / 10;

export type Kpis = {
  total: number;
  avgOverall: number;
  promoterRate: number; // % de notas 4-5
  detractorRate: number; // % de notas 1-2
  openAlerts: number; // seguimientos pendientes
  avgTiempo: number; // aspecto más flojo, para vigilar
  // deltas vs. el periodo anterior de igual duración
  deltaAvg: number;
  deltaTotal: number;
  deltaPromoter: number;
};

export function computeKpis(
  all: SurveyResponse[],
  range: RangeKey,
  sucursal: string | "all",
): Kpis {
  const scoped = filterBySucursal(all, sucursal);
  const current = filterByRange(scoped, range);

  const cfg = RANGES.find((r) => r.key === range);
  let previous: SurveyResponse[] = [];
  if (cfg?.days) {
    const start = NOW.getTime() - cfg.days * 86400000;
    const prevStart = start - cfg.days * 86400000;
    previous = scoped.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return t >= prevStart && t < start;
    });
  }

  const avg = (rows: SurveyResponse[]) =>
    rows.length ? rows.reduce((s, r) => s + r.overall, 0) / rows.length : 0;
  const promoter = (rows: SurveyResponse[]) =>
    rows.length
      ? (rows.filter((r) => r.overall >= 4).length / rows.length) * 100
      : 0;

  const avgOverall = avg(current);
  const promoterRate = promoter(current);
  const detractorRate = current.length
    ? (current.filter((r) => r.overall <= 2).length / current.length) * 100
    : 0;
  const openAlerts = current.filter(
    (r) => r.overall <= 2 && r.contacto && !r.resuelto,
  ).length;
  const avgTiempo = current.length
    ? current.reduce((s, r) => s + r.aspects.tiempo, 0) / current.length
    : 0;

  return {
    total: current.length,
    avgOverall: round1(avgOverall),
    promoterRate: Math.round(promoterRate),
    detractorRate: Math.round(detractorRate),
    openAlerts,
    avgTiempo: round1(avgTiempo),
    deltaAvg: round1(avgOverall - avg(previous)),
    deltaTotal: current.length - previous.length,
    deltaPromoter: Math.round(promoterRate - promoter(previous)),
  };
}

/** Serie temporal de satisfacción media agrupada por semana (para tendencia). */
export function overTime(
  rows: SurveyResponse[],
): { label: string; fecha: string; media: number; respuestas: number }[] {
  const buckets = new Map<string, { sum: number; n: number; date: Date }>();
  for (const r of rows) {
    const d = new Date(r.createdAt);
    // inicio de semana (lunes)
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    const b = buckets.get(key) ?? { sum: 0, n: 0, date: monday };
    b.sum += r.overall;
    b.n += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, b]) => ({
      fecha: key,
      label: b.date.toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
      }),
      media: round1(b.sum / b.n),
      respuestas: b.n,
    }));
}

/** Distribución de notas 1..5. */
export function ratingDistribution(
  rows: SurveyResponse[],
): { nota: string; cantidad: number; valor: number }[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of rows) counts[r.overall - 1] += 1;
  return counts.map((cantidad, i) => ({
    nota: `${i + 1}★`,
    valor: i + 1,
    cantidad,
  }));
}

/** Promedio por aspecto (para el radar). */
export function aspectAverages(
  rows: SurveyResponse[],
): { aspecto: string; key: AspectKey; media: number }[] {
  return ASPECTS.map(({ key, label }) => {
    const media = rows.length
      ? rows.reduce((s, r) => s + r.aspects[key], 0) / rows.length
      : 0;
    return { aspecto: label.replace(/^El |^La /, ""), key, media: round1(media) };
  });
}

/** Reparto por momento del día (para el pie). */
export function byMomento(
  rows: SurveyResponse[],
): { momento: string; cantidad: number }[] {
  return MOMENTOS.map((m) => ({
    momento: m,
    cantidad: rows.filter((r) => r.momento === m).length,
  }));
}

/** Comparación por sucursal: media y volumen. */
export function bySucursal(
  rows: SurveyResponse[],
): { sucursal: string; media: number; respuestas: number }[] {
  return SUCURSALES.map((s) => {
    const sub = rows.filter((r) => r.sucursal === s);
    return {
      sucursal: s,
      respuestas: sub.length,
      media: sub.length
        ? round1(sub.reduce((a, r) => a + r.overall, 0) / sub.length)
        : 0,
    };
  });
}

/** Frecuencia de temas a mejorar (excluye "Nada, todo bien"). */
export function temaCounts(
  rows: SurveyResponse[],
): { tema: string; cantidad: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const t of r.temas) {
      if (t === "Nada, todo bien") continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tema, cantidad]) => ({ tema, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

/** Alertas: notas bajas con contacto, para seguimiento del encargado. */
export function alerts(rows: SurveyResponse[]): SurveyResponse[] {
  return rows
    .filter((r) => r.overall <= 2 && r.contacto)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Respuestas recientes con comentario, para el muro de voces. */
export function recentWithComments(
  rows: SurveyResponse[],
  limit = 12,
): SurveyResponse[] {
  return rows
    .filter((r) => r.comentario)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
