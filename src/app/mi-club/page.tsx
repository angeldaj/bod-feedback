import type { Metadata } from "next";
import { MiClubPage } from "@/components/mi-club/mi-club-page";

export const metadata: Metadata = {
  title: "Mi Club | Área de socios de Bodega Club",
  description:
    "Panel del socio de Bodega Club: puntos, recompensas para canjear, compras, tu clásico, eventos y configuración.",
};

export default function MiClubRoute() {
  return <MiClubPage />;
}
