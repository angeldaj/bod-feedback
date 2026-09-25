import type { Metadata } from "next";
import { ActividadScreen } from "@/components/mi-club/screens/actividad-screen";

export const metadata: Metadata = {
  title: "Actividad | Mi Club",
  description: "Tus compras, puntos sumados, canjes y regalos en Bodega Club.",
};

export default function Page() {
  return <ActividadScreen />;
}
