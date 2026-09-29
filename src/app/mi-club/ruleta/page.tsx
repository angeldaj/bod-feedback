import type { Metadata } from "next";
import { RuletaScreen } from "@/components/mi-club/screens/ruleta-screen";

export const metadata: Metadata = {
  title: "Ruleta | Mi Club",
  description: "Gira la ruleta de Bodega Club: cada 3 compras ganas una tirada con puntos o productos de la casa.",
};

export default function Page() {
  return <RuletaScreen />;
}
