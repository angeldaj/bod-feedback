// La Bodega — encuesta de satisfacción. Datos y tipos.

export const STEPS = [
  "intro",
  "overall",
  "visit",
  "aspects",
  "issues",
  "contact",
  "done",
] as const;

export type StepName = (typeof STEPS)[number];

export const OVERALL_LABELS: Record<number, string> = {
  1: "Lo sentimos. Cuéntanos qué pasó.",
  2: "Podemos hacerlo mucho mejor.",
  3: "Bien, pero con detalles por pulir.",
  4: "Nos alegra. Casi perfecto.",
  5: "Gracias. Así queremos que sea siempre.",
};

export type AspectKey = "comida" | "servicio" | "ambiente" | "tiempo";

export const ASPECTS: { key: AspectKey; label: string; hint: string }[] = [
  { key: "comida", label: "La comida", hint: "Sabor, punto, temperatura" },
  { key: "servicio", label: "El servicio", hint: "Atención y trato del equipo" },
  { key: "ambiente", label: "El ambiente", hint: "Música, luz, limpieza" },
  { key: "tiempo", label: "El tiempo de espera", hint: "Desde el pedido hasta la mesa" },
];

// Nombres placeholder — confirmar los reales antes de publicar.
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

export const STEP_ANNOUNCE: Record<StepName, string> = {
  intro: "Bienvenida",
  overall: "Paso 1 de 5, ¿qué tal la pasaste?",
  visit: "Paso 2 de 5, ¿dónde nos visitaste?",
  aspects: "Paso 3 de 5, ¿cómo estuvo cada cosa?",
  issues: "Paso 4 de 5, algo que mejorar",
  contact: "Paso 5 de 5, contacto",
  done: "Encuesta completada, gracias",
};

export type SurveyState = {
  overall: number; // 0 | 1..5
  sucursal: string;
  momento: string;
  aspects: Record<AspectKey, number>;
  temas: string[];
  comentario: string;
  nombre: string;
  contacto: string;
};

export const initialSurvey: SurveyState = {
  overall: 0,
  sucursal: "",
  momento: "",
  aspects: { comida: 0, servicio: 0, ambiente: 0, tiempo: 0 },
  temas: [],
  comentario: "",
  nombre: "",
  contacto: "",
};
