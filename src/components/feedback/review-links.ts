// Links de reseña en Google Maps por sucursal (pantalla de gracias de la
// encuesta, solo para promotores: NPS 9–10).
//
// TODO(feedback-v2): pendiente que el dueño provea los 3 links de Google Maps
// (spec 2026-09-24, "Pendiente del usuario"). Mientras un valor esté vacío, el
// botón "Déjanos una reseña en Google" NO se muestra para esa sucursal.
// La clave es el nombre de la sucursal tal como lo devuelve
// `GET /feedback/branches`.
export const GOOGLE_REVIEW_URLS: Record<string, string> = {
  "Bodega 1": "",
  "Bodega 2": "",
  "Bodega 3": "",
};

export function reviewUrlFor(branchName: string | undefined): string | null {
  if (!branchName) return null;
  return GOOGLE_REVIEW_URLS[branchName]?.trim() || null;
}
