"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { BrandLogo } from "@/components/satisfaccion/brand-logo";

/**
 * Editorial food hero for the "Panadería de día" shell.
 *
 * Uses keyword stock photography (loremflickr, deterministic via `lock`) as a
 * placeholder. To ship real/branded shots, drop a file in `/public/img` and
 * point `src` at it (e.g. src="/img/hero.jpg") — no other change needed.
 *
 * The white brand lockup sits over a bottom scrim so it stays legible on any
 * photo; a warm gradient lives under the image as a graceful fallback.
 */
const HERO_SRC =
  "https://loremflickr.com/1280/620/bakery,bread,pastry,cafe?lock=42";

export function FoodHero({
  theme,
  onToggleTheme,
}: {
  theme: "day" | "night";
  onToggleTheme: () => void;
}) {
  const reduce = useReducedMotion();
  const toDark = theme === "day";
  return (
    <div className="day-hero aspect-[1280/560] w-full max-[560px]:aspect-[1280/720]">
      <motion.div
        initial={reduce ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src={HERO_SRC}
          alt="Mesa de La Bodega: pan recién horneado y café"
          fill
          priority
          unoptimized
          sizes="(max-width: 720px) 100vw, 720px"
          className="day-hero__img"
        />
      </motion.div>
      <div className="day-hero__scrim" />

      {/* Toggle claro/oscuro. Vive sobre la foto (que tiene scrim en ambos
          temas), así el icono blanco siempre es legible. */}
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={toDark ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
        title={toDark ? "Modo oscuro" : "Modo claro"}
        className="absolute right-4 top-4 z-[2] inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,244,232,0.38)] bg-[rgba(24,10,4,0.42)] text-[rgba(255,244,232,0.95)] backdrop-blur-md transition-transform hover:scale-105 active:scale-95 max-[560px]:h-9 max-[560px]:w-9"
      >
        <motion.span
          key={theme}
          initial={reduce ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          className="inline-flex"
        >
          {toDark ? (
            <Moon size={18} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Sun size={18} strokeWidth={2} aria-hidden="true" />
          )}
        </motion.span>
      </button>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 max-[560px]:p-4"
      >
        <div className="flex flex-col gap-1.5">
          <BrandLogo width={116} />
          <span className="pl-[0.28em] text-[11px] font-medium uppercase tracking-[0.28em] text-[rgba(255,244,232,0.86)]">
            Restaurante · Panadería
          </span>
        </div>
        <span className="mb-1 hidden rounded-full border border-[rgba(255,244,232,0.4)] bg-[rgba(24,10,4,0.35)] px-3.5 py-1.5 text-[12px] font-medium text-[rgba(255,244,232,0.92)] backdrop-blur-md min-[560px]:inline-block">
          Puerto Ordaz · Venezuela
        </span>
      </motion.div>
    </div>
  );
}
