import type { Metadata } from "next";
import { FeedbackExperience } from "@/components/feedback/feedback-experience";

export const metadata: Metadata = {
  title: "Cuéntanos cómo te fue",
  description:
    "Deja tu opinión sobre tu visita a La Bodega o reporta una urgencia. Cambia entre ambos formularios en un toque.",
};

export default function FeedbackPage() {
  return <FeedbackExperience />;
}
