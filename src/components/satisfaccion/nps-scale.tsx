"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { springBouncy } from "./motion";

type Props = {
  value: number | null;
  onChange: (n: number) => void;
  ariaLabel: string;
  describedBy?: string;
  invalid?: boolean;
};

const VALUES = Array.from({ length: 11 }, (_, i) => i);

// Mismo ramp de sentimiento que la nota general: coral para detractores
// (0–6), ámbar para pasivos (7–8), oro para promotores (9–10).
function sentFor(n: number): string {
  if (n <= 3) return "#e2492a";
  if (n <= 6) return "#ff6a3d";
  if (n <= 8) return "#f5a623";
  return "#efc77e";
}

/**
 * Escala NPS 0–10. Es una elección, no un medidor: solo se rellena el número
 * elegido. En 375 px va en dos filas (0–5 / 6–10) con casillas de 44 px o más;
 * desde 560 px, una sola fila de once.
 */
export function NpsScale({ value, onChange, ariaLabel, describedBy, invalid }: Props) {
  const reduce = useReducedMotion();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const tabStop = value ?? 0;

  function onKeyDown(e: React.KeyboardEvent, n: number) {
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const target = Math.min(10, Math.max(0, n + delta));
    refs.current[target]?.focus();
    onChange(target);
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required
      className="grid w-full grid-cols-6 gap-2 min-[560px]:grid-cols-11 min-[560px]:gap-1.5"
    >
      {VALUES.map((n) => {
        const on = value === n;
        return (
          <motion.button
            key={n}
            ref={(node) => {
              refs.current[n] = node;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${n} de 10`}
            data-filled={on}
            data-invalid={invalid || undefined}
            tabIndex={n === tabStop ? 0 : -1}
            onClick={() => onChange(n)}
            onKeyDown={(e) => onKeyDown(e, n)}
            whileTap={reduce ? undefined : { scale: 0.9 }}
            animate={reduce ? undefined : { scale: on ? 1.08 : 1, y: on ? -2 : 0 }}
            transition={springBouncy}
            style={{ ["--sent" as string]: sentFor(n) }}
            className="pop-rate h-12 w-full select-none font-sans text-[19px] font-semibold tabular-nums"
          >
            {n}
          </motion.button>
        );
      })}
    </div>
  );
}
