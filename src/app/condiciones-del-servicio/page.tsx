import type { Metadata } from "next";
import { LegalPage } from "@/components/bodega-club/legal-page";

export const metadata: Metadata = {
  title: "Condiciones del servicio de Bodega Club",
  description: "Consulta las condiciones de participación, puntos y recompensas de Bodega Club.",
};

export default function Page() {
  return <LegalPage kind="terms" />;
}
