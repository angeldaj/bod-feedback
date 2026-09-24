// Adapter de la API de feedback de La Bodega (la-bodega-api, módulo feedback,
// specs 059/071). La landing vive en otro origen (labodega-ve.com) y habla con
// el backend por su URL absoluta; los endpoints de envío son públicos (sin
// sesión de empleado). El socio del club puede identificarse con su Bearer.
//
// Único punto de contacto con el backend desde la landing: si cambian los
// endpoints, se toca solo este archivo. Al backend viajan CLAVES (las de
// `components/feedback/feedback-catalog.ts`); las etiquetas en español viven
// en la landing.

import {
  ASPECTS_BY_CHANNEL,
  toE164,
  type IncidentPriority,
} from "@/components/feedback/feedback-catalog";
import type { SurveyState } from "@/components/satisfaccion/survey-data";
import type { IncidentState, MediaItem } from "@/components/reportar/incident-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://app.bod-service.cloud/api";

export type Branch = { id: string; name: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const raw =
      body && typeof body === "object" && "message" in body
        ? (body as { message: unknown }).message
        : null;
    // Nest devuelve `message` como string o como lista (errores de validación).
    const message = Array.isArray(raw) ? raw.join(" ") : raw ? String(raw) : `Error ${response.status}`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function authHeader(accessToken?: string | null): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

let branchesCache: Branch[] | null = null;

export async function fetchBranches(): Promise<Branch[]> {
  if (branchesCache) return branchesCache;
  const branches = await request<Branch[]>("/feedback/branches");
  branchesCache = branches;
  return branches;
}

export type SurveyResult = { id: string; pointsAwarded: number };

/**
 * `POST /feedback/surveys`. Encuesta ANÓNIMA: no viaja nombre ni contacto.
 * Con `accessToken` (socio con sesión, spec 070) el backend la vincula a su
 * cuenta y suma puntos; `pointsAwarded` es 0 si es anónima o ya sumó hoy.
 */
export async function submitSurvey(
  state: SurveyState,
  accessToken?: string | null,
): Promise<SurveyResult> {
  if (!state.channel || !state.moment || state.recommend === null) {
    throw new Error("Faltan datos de la encuesta.");
  }
  // Solo los aspectos del canal; lo no puntuado viaja como null (071).
  const aspects = Object.fromEntries(
    ASPECTS_BY_CHANNEL[state.channel].map(({ key }) => [key, state.aspects[key] ?? null]),
  );
  return request<SurveyResult>("/feedback/surveys", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(accessToken) },
    body: JSON.stringify({
      branchId: state.branchId,
      channel: state.channel,
      moment: state.moment,
      overall: state.overall,
      recommend: state.recommend,
      aspects,
      positiveTopics: state.positiveTopics,
      negativeTopics: state.negativeTopics,
      comment: state.comment.trim() || undefined,
      staffMention: state.staffMention.trim() || undefined,
    }),
  });
}

export type IncidentResult = { id: string; caseNumber: string; priority: IncidentPriority };

const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

/**
 * `POST /feedback/incidents` (multipart). `categories` viaja como array JSON de
 * claves; el WhatsApp, ya en E.164. Devuelve el número de caso y la prioridad.
 */
export async function submitIncident(
  state: IncidentState,
  media: MediaItem[],
  audio: Blob | null,
  options: { surveyId?: string; accessToken?: string | null } = {},
): Promise<IncidentResult> {
  if (!state.channel) throw new Error("Cuéntanos cómo nos visitaste.");
  const form = new FormData();
  form.set("branchId", state.branchId);
  form.set("channel", state.channel);
  if (state.channel === "delivery" && state.orderNumber.trim()) {
    form.set("orderNumber", state.orderNumber.trim());
  }
  form.set("categories", JSON.stringify(state.categories));
  if (state.description.trim()) form.set("description", state.description.trim());
  if (state.name.trim()) form.set("name", state.name.trim());
  const phone = state.phone ? toE164(state.phone) : null;
  if (phone) form.set("phone", phone);
  if (options.surveyId) form.set("surveyId", options.surveyId);
  for (const item of media) {
    form.append("files", item.file, item.file.name);
  }
  if (audio) {
    // El MIME puede traer codecs ("audio/webm;codecs=opus"); el backend compara
    // el tipo base, así que se manda limpio.
    const type = audio.type.split(";")[0] || "audio/webm";
    const ext = AUDIO_EXTENSIONS[type] ?? "webm";
    form.append("files", new File([audio], `nota-de-voz.${ext}`, { type }));
  }
  return request<IncidentResult>("/feedback/incidents", {
    method: "POST",
    headers: authHeader(options.accessToken),
    body: form,
  });
}
