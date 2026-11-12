import type { Metadata } from "next";
import { gameFonts } from "@/components/mi-club/game-fonts";
import { BodingoScreen } from "@/components/mi-club/screens/bodingo-screen";

export const metadata: Metadata = {
  title: "Bodingo | Mi Club",
  description: "El bingo de La Bodega: compra tus cartones con puntos y juega cartón lleno el domingo a las 7 p. m.",
};

export default function Page() {
  return (
    <div className={gameFonts}>
      <BodingoScreen />
    </div>
  );
}
