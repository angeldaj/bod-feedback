"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "cn";
import { ledgerItem } from "./motion";

type PanelProps = {
  /** Etiqueta en versalitas (Barlow), el rótulo del libro de sala. */
  eyebrow?: string;
  /** Aparte en serif (Cormorant) a la derecha del rótulo — el acento de marca. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

/**
 * Panel del "libro de sala": fondo casi negro, una regla de oro arriba
 * (como el renglón de un libro contable) y hairlines finos alrededor.
 * Radius 0, sin sombras — la separación es por hairline y valor.
 */
export function Panel({
  eyebrow,
  aside,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <motion.section
      variants={ledgerItem}
      className={cn(
        // regla de oro arriba + marco hairline tenue; ground de tarjeta
        "relative flex flex-col border-t border-hair-card bg-card",
        "shadow-none [box-shadow:none] ring-1 ring-hair-div",
        className,
      )}
    >
      {(eyebrow || aside) && (
        <header className="flex items-baseline justify-between gap-4 border-b border-hair-div px-5 py-3.5">
          {eyebrow && (
            <h2 className="text-[12px] font-medium uppercase tracking-[0.22em] text-label">
              {eyebrow}
            </h2>
          )}
          {aside && (
            <span className="font-serif text-[16px] italic leading-none text-muted-ink">
              {aside}
            </span>
          )}
        </header>
      )}
      <div className={cn("flex-1 px-5 py-4", bodyClassName)}>{children}</div>
    </motion.section>
  );
}
