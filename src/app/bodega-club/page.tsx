import type { Metadata } from "next";
import { BodegaClubPage } from "@/components/bodega-club/bodega-club-page";

export const metadata: Metadata = {
  title: "Bodega Club | Puntos y beneficios en La Bodega",
  description:
    "Únete gratis a Bodega Club, suma puntos con cada compra y disfruta recompensas, cumpleaños, delivery y experiencias en La Bodega.",
};

export default function Page() {
  return <BodegaClubPage />;
}

