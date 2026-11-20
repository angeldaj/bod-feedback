import localFont from "next/font/local";

// Fuentes de los minijuegos (spec 153): solo se cargan en sus páginas.
const shrikhand = localFont({ src: "../../../public/fonts/games/shrikhand.ttf", weight: "400", variable: "--font-game-display", display: "swap" });
const shoulders = localFont({ src: "../../../public/fonts/games/bigshoulders.ttf", weight: "100 900", variable: "--font-game-num", display: "swap" });
const hanken = localFont({ src: "../../../public/fonts/games/hankengrotesk.ttf", weight: "100 900", variable: "--font-game-body", display: "swap" });

/** Clase para el contenedor de una página de juego (expone las variables de fuente). */
export const gameFonts = `${shrikhand.variable} ${shoulders.variable} ${hanken.variable} game-fonts`;
