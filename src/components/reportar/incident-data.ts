// La Bodega — reporte de situación crítica / urgente. Datos y tipos.
// Copy final en español (Venezuela). No reescribir sin pedir.

export const PROBLEMAS = [
  "Comida en mal estado",
  "Objeto extraño / insecto",
  "Cruda o mal cocida",
  "Llegó fría",
  "Reacción alérgica",
  "Higiene del local",
  "Otro",
] as const;

export const SUCURSALES = ["Bodega 1", "Bodega 2", "Bodega 3"] as const;

export type IncidentState = {
  problemas: string[];
  sucursal: string;
  descripcion: string;
  // Evidencia y audio no viven en el estado serializable; se manejan aparte.
  nombre: string;
  contacto: string;
};

export const initialIncident: IncidentState = {
  problemas: [],
  sucursal: "",
  descripcion: "",
  nombre: "",
  contacto: "",
};

export type MediaItem = {
  id: string;
  file: File;
  url: string;
  kind: "image" | "video";
};
