import type { Metadata } from "next";
import { MinijuegosScreen } from "@/components/mi-club/screens/minijuegos-screen";

export const metadata: Metadata = {
  title: "Minijuegos | Mi Club",
  description: "Ruleta, Bodingo y Palabra del día: los juegos de Bodega Club para sumar puntos.",
};

export default function Page() {
  return <MinijuegosScreen />;
}
