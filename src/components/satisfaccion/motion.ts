import type { Transition, Variants } from "motion/react";

// Ease-out expo-ish del handoff. Sin bounce, sin elastic.
export const EASE_BRAND = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.4, 0, 1, 1] as const;

export const enterTransition: Transition = {
  duration: 0.4,
  ease: EASE_BRAND,
};

// Contenedor de cada paso: stagger de los hijos al entrar.
export const stepContainer: Variants = {
  hidden: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: 0.28, ease: EASE_BRAND, staggerChildren: 0.07, delayChildren: 0.02 },
  },
  leaving: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: EASE_IN },
  },
};

// Cada bloque de un paso sube 14px y aparece.
export const stepItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_BRAND } },
};

// Entrada del shell (marca, progreso, tarjeta, pie).
export const shellItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_BRAND } },
};

export const shellContainer: Variants = {
  hidden: {},
  enter: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
