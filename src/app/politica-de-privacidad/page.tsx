import type { Metadata } from "next";
import { LegalPage } from "@/components/bodega-club/legal-page";

export const metadata: Metadata = {
  title: "Política de privacidad de Bodega Club",
  description: "Conoce cómo Bodega Club usa y protege los datos de tu membresía.",
};

export default function Page() {
  return <LegalPage kind="privacy" />;
}
