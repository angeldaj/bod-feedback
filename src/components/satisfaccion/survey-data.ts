// La Bodega — encuesta de satisfacción v2 (anónima, por canal). Datos y tipos.
// Copy aprobado en docs/superpowers/specs/2026-09-24-feedback-v2.md.

import type { AspectKey, Channel, Moment, Topic } from "@/components/feedback/feedback-catalog";

export const STEPS = ["visit", "overall", "aspects", "topics", "recommend", "done"] as const;
export type StepName = (typeof STEPS)[number];

/** Pasos numerados (todo menos "done"). */
export const NUM_STEPS = 5;

export const OVERALL_LABELS: Record<number, string> = {
  1: "Lo sentimos. Cuéntanos qué pasó.",
  2: "Podemos hacerlo mucho mejor.",
  3: "Bien, pero con detalles por pulir.",
  4: "Nos alegra. Casi perfecto.",
  5: "Gracias. Así queremos que sea siempre.",
};

export const STEP_ANNOUNCE: Record<StepName, string> = {
  visit: "Paso 1 de 5, ¿dónde nos visitaste?",
  overall: "Paso 2 de 5, ¿qué tal la pasaste?",
  aspects: "Paso 3 de 5, ¿cómo estuvo cada cosa?",
  topics: "Paso 4 de 5, lo que más te gustó y lo que podemos mejorar",
  recommend: "Paso 5 de 5, ¿nos recomendarías?",
  done: "Encuesta enviada, gracias",
};

export type SurveyState = {
  branchId: string;
  channel: Channel | "";
  moment: Moment | "";
  overall: number; // 0 = sin responder | 1..5
  /** Solo lo puntuado; lo que falte viaja como null. */
  aspects: Partial<Record<AspectKey, number>>;
  positiveTopics: Topic[];
  negativeTopics: Topic[];
  staffMention: string;
  comment: string;
  recommend: number | null; // null = sin responder | 0..10
};

export const initialSurvey: SurveyState = {
  branchId: "",
  channel: "",
  moment: "",
  overall: 0,
  aspects: {},
  positiveTopics: [],
  negativeTopics: [],
  staffMention: "",
  comment: "",
  recommend: null,
};

/** Campos obligatorios que pueden faltar en un paso. */
export type SurveyField = "branchId" | "channel" | "moment" | "overall" | "recommend";

export const FIELD_ERRORS: Record<SurveyField, string> = {
  branchId: "Elige la sucursal que visitaste.",
  channel: "Cuéntanos cómo nos visitaste.",
  moment: "Elige en qué momento fue.",
  overall: "Elige una nota del 1 al 5 para seguir.",
  recommend: "Elige un número del 0 al 10 para enviar.",
};

/** Obligatorios vacíos del paso, en orden de aparición. */
export function missingFields(step: StepName, s: SurveyState): SurveyField[] {
  switch (step) {
    case "visit":
      return [
        ...(!s.branchId ? (["branchId"] as const) : []),
        ...(!s.channel ? (["channel"] as const) : []),
        ...(!s.moment ? (["moment"] as const) : []),
      ];
    case "overall":
      return s.overall ? [] : ["overall"];
    case "recommend":
      return s.recommend === null ? ["recommend"] : [];
    default:
      return [];
  }
}

/** Detractor: nota ≤ 2 o NPS ≤ 6 → se ofrece el puente a queja. */
export function isDetractor(s: SurveyState): boolean {
  return (s.overall > 0 && s.overall <= 2) || (s.recommend !== null && s.recommend <= 6);
}
