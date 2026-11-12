import type { Metadata } from "next";
import { gameFonts } from "@/components/mi-club/game-fonts";
import { PalabraPublic } from "@/components/mi-club/word/palabra-public";

export const metadata: Metadata = {
  title: "Palabra del día | La Bodega",
  description: "El juego diario de La Bodega: adivina la palabra en 6 intentos. Los socios de Bodega Club suman puntos y racha.",
  openGraph: {
    title: "Palabra del día de La Bodega",
    description: "Adivina la palabra en 6 intentos y compara tu resultado.",
  },
};

export default function Page() {
  return (
    <div className={gameFonts}>
      <PalabraPublic />
    </div>
  );
}
