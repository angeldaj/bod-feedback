import type { Metadata } from "next";
import { SurveyExperience } from "@/components/satisfaccion/survey-experience";

export const metadata: Metadata = {
  title: "Encuesta de satisfacción",
  description:
    "Cuéntanos cómo estuvo tu visita a La Bodega. Seis preguntas, menos de dos minutos.",
};

export default function SatisfaccionPage() {
  return <SurveyExperience />;
}
