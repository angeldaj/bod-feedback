// La Bodega — queja v2 (un caso con catálogo agrupado). Datos y tipos.
// Copy aprobado en docs/superpowers/specs/2026-09-24-feedback-v2.md.

import type { Channel, IncidentCategory } from "@/components/feedback/feedback-catalog";

export const INCIDENT_STEPS = ["where", "what", "contact"] as const;
export type IncidentStep = (typeof INCIDENT_STEPS)[number];

export const INCIDENT_STEP_ANNOUNCE: Record<IncidentStep, string> = {
  where: "Paso 1 de 3, ¿dónde fue?",
  what: "Paso 2 de 3, ¿qué pasó?",
  contact: "Paso 3 de 3, ¿cómo te contactamos?",
};

export type IncidentState = {
  branchId: string;
  channel: Channel | "";
  orderNumber: string;
  categories: IncidentCategory[];
  description: string;
  name: string;
  /** Solo los 10 dígitos nacionales (`4141234567`); el `+58` es fijo. */
  phone: string;
};

export const initialIncident: IncidentState = {
  branchId: "",
  channel: "",
  orderNumber: "",
  categories: [],
  description: "",
  name: "",
  phone: "",
};

/** Lo que el puente encuesta → queja trae precargado. */
export type IncidentPrefill = {
  branchId?: string;
  channel?: Channel | "";
  description?: string;
  /** Encuesta de origen (solo cuando ya se envió). */
  surveyId?: string;
};

export type MediaItem = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "video";
};
