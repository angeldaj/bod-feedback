"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { springBouncy } from "@/components/satisfaccion/motion";
import { MAX_QTY } from "./use-cart";

export const cls = {
  eyebrow: "text-[12px] font-semibold uppercase tracking-[0.2em] text-gold",
  title: "m-0 text-[34px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream",
  label: "text-[13px] font-medium uppercase tracking-[0.14em] text-label",
  panel: "rounded-[22px] border border-hair-div bg-[rgba(247,242,231,0.035)]",
  error: "text-[14px] text-coral",
};

/** Encabezado de los pasos posteriores al catálogo: volver + título. */
export function StepHeader({
  eyebrow,
  title,
  onBack,
}: {
  eyebrow: string;
  title: string;
  onBack: () => void;
}) {
  return (
    <header className="flex items-center gap-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-hair-ghost text-cream transition-colors hover:border-gold hover:text-gold"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex flex-col gap-1">
        <span className={cls.eyebrow}>{eyebrow}</span>
        <h1 className={cls.title}>{title}</h1>
      </div>
    </header>
  );
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  size = "md",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  size?: "sm" | "md";
}) {
  const reduce = useReducedMotion();
  const btn =
    size === "md"
      ? "size-12"
      : "size-9";
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-hair-chip p-1">
      <motion.button
        type="button"
        aria-label="Quitar uno"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        whileTap={reduce ? undefined : { scale: 0.88 }}
        transition={springBouncy}
        className={`${btn} inline-flex items-center justify-center rounded-full text-cream transition-colors hover:bg-[rgba(247,242,231,0.08)] disabled:opacity-35`}
      >
        <Minus size={size === "md" ? 20 : 16} />
      </motion.button>
      <span
        aria-live="polite"
        className={`min-w-[2ch] text-center font-serif font-semibold text-cream ${size === "md" ? "text-[28px]" : "text-[20px]"}`}
      >
        {value}
      </span>
      <motion.button
        type="button"
        aria-label="Agregar uno"
        disabled={value >= MAX_QTY}
        onClick={() => onChange(Math.min(MAX_QTY, value + 1))}
        whileTap={reduce ? undefined : { scale: 0.88 }}
        transition={springBouncy}
        className={`${btn} inline-flex items-center justify-center rounded-full text-cream transition-colors hover:bg-[rgba(247,242,231,0.08)] disabled:opacity-35`}
      >
        <Plus size={size === "md" ? 20 : 16} />
      </motion.button>
    </div>
  );
}
