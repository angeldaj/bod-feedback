import type { Metadata } from "next";
import { gameFonts } from "@/components/mi-club/game-fonts";
import { PalabraScreen } from "@/components/mi-club/screens/palabra-screen";

export const metadata: Metadata = {
  title: "Palabra del día | Mi Club",
  description: "Adivina la palabra de la bodega en 6 intentos, suma puntos y cuida tu racha.",
};

export default function Page() {
  return (
    <div className={gameFonts}>
      <PalabraScreen />
    </div>
  );
}
