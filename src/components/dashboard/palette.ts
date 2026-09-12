// Paleta del panel — vive dentro del mundo de La Bodega: candelabro, latón,
// oro. Un solo acento (oro); la terracota sólo aparece donde significa "algo
// que atender". Nada de arcoíris SaaS.

export const CANDLE = {
  creamGold: "#f3dca0",
  goldHi: "#efc77e",
  gold: "#d9a94a",
  brass: "#a97f30",
  deepBrass: "#75551f",
  terracotta: "#c8543a",
  terracottaDim: "#9e4630",
} as const;

// Escala de calor por sentimiento para las notas 1..5 (problema → deleite).
export const RATING_COLORS: Record<number, string> = {
  1: "#a5402c",
  2: "#c8543a",
  3: "#b58a46",
  4: "#d9a94a",
  5: "#efc77e",
};

// Rampa de oro para categorías (se distinguen por valor, no por matiz).
export const GOLD_RAMP = [
  CANDLE.creamGold,
  CANDLE.gold,
  CANDLE.brass,
  CANDLE.deepBrass,
] as const;

// Rejillas y ejes: hairlines del sistema.
export const GRID = "rgba(217,169,74,0.12)";
export const AXIS_TEXT = "#8e8267"; // --lb-label
export const AXIS_TEXT_HI = "#b4a382"; // --lb-muted
