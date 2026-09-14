import { redirect } from "next/navigation";

// El reporte de urgencias vive ahora en /feedback (pestaña "urgencia").
// Mantenemos esta ruta como redirección para no romper enlaces antiguos.
export default function ReportarPage() {
  redirect("/feedback?tab=urgente");
}
