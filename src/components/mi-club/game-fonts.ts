import { Big_Shoulders, Hanken_Grotesk, Shrikhand } from "next/font/google";

// Fuentes de los minijuegos (spec 153): solo se cargan en sus páginas.
const shrikhand = Shrikhand({ weight: "400", subsets: ["latin"], variable: "--font-game-display", display: "swap" });
const shoulders = Big_Shoulders({ weight: ["700", "800", "900"], subsets: ["latin"], variable: "--font-game-num", display: "swap" });
const hanken = Hanken_Grotesk({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], variable: "--font-game-body", display: "swap" });

/** Clase para el contenedor de una página de juego (expone las variables de fuente). */
export const gameFonts = `${shrikhand.variable} ${shoulders.variable} ${hanken.variable} game-fonts`;
