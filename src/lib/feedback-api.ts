// Adapter de la API de feedback de La Bodega (la-bodega-api, módulo feedback,
// spec 059). Reemplaza los envíos simulados de la encuesta y la queja. La
// landing vive en otro origen (labodega.com) y habla con el backend por su URL
// absoluta; los endpoints de envío son públicos (sin sesión).
//
// Único punto de contacto con el backend desde la landing: si cambian los
// endpoints, se toca solo este archivo.

import type { SurveyState } from "@/components/satisfaccion/survey-data";
import type { IncidentState, MediaItem } from "@/components/reportar/incident-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://app.bod-service.cloud/api";

export type Branch = { id: string; name: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Error ${response.status}`;
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

let branchesCache: Branch[] | null = null;

export async function fetchBranches(): Promise<Branch[]> {
  if (branchesCache) return branchesCache;
  const branches = await request<Branch[]>("/feedback/branches");
  branchesCache = branches;
  return branches;
}

/** Resuelve el id de la sucursal a partir de su nombre (lo que guarda el wizard). */
async function resolveBranchId(name: string): Promise<string> {
  const branches = await fetchBranches();
  const match = branches.find((branch) => branch.name === name);
  if (!match) {
    throw new Error("Elige una sucursal válida.");
  }
  return match.id;
}

/**
 * `accessToken` es opcional: si el socio tiene sesión iniciada (070), se manda
 * el Bearer para que el backend vincule la encuesta a su cuenta y sume puntos.
 * Sin sesión, el envío sigue siendo anónimo — no se pide cédula suelta.
 */
export async function submitSurvey(state: SurveyState, accessToken?: string | null): Promise<void> {
  const branchId = await resolveBranchId(state.sucursal);
  await request<unknown>("/feedback/surveys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      branchId,
      overall: state.overall,
      visitMoment: state.momento,
      // El wizard usa claves en español; el backend, en inglés.
      aspects: {
        food: state.aspects.comida,
        service: state.aspects.servicio,
        ambiance: state.aspects.ambiente,
        waitTime: state.aspects.tiempo,
      },
      topics: state.temas,
      comment: state.comentario,
      name: state.nombre,
      contact: state.contacto,
    }),
  });
}

const AUDIO_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
};

export async function submitIncident(
  state: IncidentState,
  media: MediaItem[],
  audio?: Blob | null,
): Promise<void> {
  const branchId = await resolveBranchId(state.sucursal);
  const form = new FormData();
  form.set("branchId", branchId);
  form.set("problems", JSON.stringify(state.problemas));
  form.set("description", state.descripcion);
  form.set("name", state.nombre);
  form.set("contact", state.contacto);
  for (const item of media) {
    form.append("files", item.file, item.file.name);
  }
  if (audio) {
    const ext = AUDIO_EXTENSIONS[audio.type] ?? "webm";
    form.append("files", audio, `nota-de-voz.${ext}`);
  }
  await request<unknown>("/feedback/incidents", {
    method: "POST",
    body: form,
  });
}
