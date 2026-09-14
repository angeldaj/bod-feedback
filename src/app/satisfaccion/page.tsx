import { redirect } from "next/navigation";

// La encuesta vive ahora en /feedback (pestaña por defecto). Mantenemos esta
// ruta como redirección para no romper enlaces/QR antiguos.
export default function SatisfaccionPage() {
  redirect("/feedback");
}
