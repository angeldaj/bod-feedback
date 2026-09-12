"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "cn";
import { CountUp } from "./count-up";
import { ledgerItem } from "./motion";

type StatTileProps = {
  eyebrow: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Denominador opcional que acompaña al numeral (ej. "/ 5"). */
  outOf?: string;
  delta?: number | null;
  deltaSuffix?: string;
  /** Cuando true, subir es malo (ej. alertas): invierte el color de la señal. */
  invertTrend?: boolean;
  footnote?: string;
  accent?: "gold" | "terracotta";
};

export function StatTile({
  eyebrow,
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  outOf,
  delta = null,
  deltaSuffix = "",
  invertTrend = false,
  footnote,
  accent = "gold",
}: StatTileProps) {
  const hasDelta = delta !== null && delta !== undefined;
  const isFlat = hasDelta && Math.abs(delta as number) < 0.05;
  const good = hasDelta
    ? invertTrend
      ? (delta as number) < 0
      : (delta as number) > 0
    : true;

  const numeralColor =
    accent === "terracotta" ? "text-[#d9694f]" : "text-gold";

  return (
    <motion.div
      variants={ledgerItem}
      className="group/tile relative flex flex-col justify-between border-t border-hair-card bg-card px-5 pb-5 pt-4 ring-1 ring-hair-div"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="max-w-[16ch] text-[12px] font-medium uppercase leading-tight tracking-[0.2em] text-label">
          {eyebrow}
        </h3>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 text-[13px] font-medium tabular-nums",
              isFlat
                ? "text-muted-ink"
                : good
                  ? "text-gold-accent"
                  : "text-[#d9694f]",
            )}
            title="Frente al periodo anterior"
          >
            {isFlat ? (
              <Minus className="size-3.5" />
            ) : (delta as number) > 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {(delta as number) > 0 ? "+" : ""}
            {(delta as number).toLocaleString("es-VE", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}
            {deltaSuffix}
          </span>
        )}
      </div>

      <div className="mt-6 flex items-baseline gap-2">
        <CountUp
          value={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          className={cn(
            "font-serif text-[clamp(46px,6vw,60px)] leading-[0.85] tracking-[-0.01em]",
            numeralColor,
          )}
        />
        {outOf && (
          <span className="font-serif text-[24px] italic leading-none text-placeholder">
            {outOf}
          </span>
        )}
      </div>

      {footnote && (
        <p className="mt-3 text-[13px] leading-snug text-muted-ink">
          {footnote}
        </p>
      )}
    </motion.div>
  );
}
