import type { Variants } from "motion/react";
import { EASE_BRAND } from "@/components/satisfaccion/motion";

export { EASE_BRAND } from "@/components/satisfaccion/motion";

// Ledger: los paneles se revelan de abajo hacia arriba, escalonados.
export const ledgerContainer: Variants = {
  hidden: {},
  enter: {
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

export const ledgerItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_BRAND },
  },
};

// Curva compartida con las gráficas (recharts usa duración en ms).
export const CHART_ANIM_MS = 850;
