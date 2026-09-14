import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";

export const metadata: Metadata = {
  title: "La Bodega · Panadería y Restaurante en Puerto Ordaz",
  description:
    "Pan del día y cocina de casa en Puerto Ordaz. Desayunos, almuerzos, café y postres recién hechos. Conoce la carta, la historia y cómo visitarnos.",
};

export default function Home() {
  return <Landing />;
}
