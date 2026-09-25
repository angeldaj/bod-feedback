"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { springBouncy } from "./motion";

type Props = {
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
  variant?: "overall" | "dots";
  /** Tocar de nuevo la nota elegida la borra (aspectos opcionales). */
  clearable?: boolean;
  describedBy?: string;
  invalid?: boolean;
};

// Sentiment ramp: la nota tiñe las casillas rellenas de coral (bajo) a oro (alto).
const SENT: Record<number, string> = {
  1: "#e2492a",
  2: "#ff6a3d",
  3: "#f5a623",
  4: "#e0b45c",
  5: "#efc77e",
};

export function RatingScale({
  value,
  onChange,
  ariaLabel,
  variant = "overall",
  clearable = false,
  describedBy,
  invalid,
}: Props) {
  const reduce = useReducedMotion();
  const [preview, setPreview] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isDots = variant === "dots";
  // El color activo lo marca el valor (o el preview en hover) más alto.
  const active = preview || value;
  const sent = isDots ? "var(--lb-gold)" : SENT[active] ?? "var(--lb-gold)";

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const dir =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -1
          : 0;
    if (!dir) return;
    e.preventDefault();
    const target = Math.min(4, Math.max(0, i + dir));
    btnRefs.current[target]?.focus();
    onChange(target + 1);
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required={!clearable || undefined}
      className={cn(
        isDots ? "flex gap-2.5" : "grid w-full max-w-[430px] grid-cols-5 gap-2.5 max-[560px]:gap-2",
      )}
      style={{ ["--sent" as string]: sent }}
      onMouseLeave={() => setPreview(0)}
    >
      {[1, 2, 3, 4, 5].map((n, i) => {
        const filled = n <= value;
        const isPreview = preview > 0 && n <= preview && n > value;
        return (
          <motion.button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} de 5`}
            data-filled={filled}
            data-preview={isPreview}
            data-invalid={invalid || undefined}
            ref={(node) => {
              btnRefs.current[i] = node;
            }}
            tabIndex={value === 0 ? (n === 1 ? 0 : -1) : n === value ? 0 : -1}
            onMouseEnter={() => setPreview(n)}
            onClick={() => onChange(clearable && n === value ? 0 : n)}
            onKeyDown={(e) => onKeyDown(e, i)}
            whileTap={reduce ? undefined : { scale: 0.9 }}
            animate={
              reduce
                ? undefined
                : { scale: n === value ? 1.06 : 1, y: n === value ? -2 : 0 }
            }
            transition={springBouncy}
            className={cn(
              "pop-rate select-none",
              isDots
                ? "h-11 w-11 font-sans text-[16px] font-medium"
                : "aspect-square w-full text-[32px] max-[560px]:text-[26px]",
            )}
          >
            {n}
          </motion.button>
        );
      })}
    </div>
  );
}
