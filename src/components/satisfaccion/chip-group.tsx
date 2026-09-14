"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { springBouncy } from "./motion";

type SingleProps = {
  options: readonly string[];
  ariaLabel: string;
  variant: "branch" | "topic";
  tone?: "gold" | "danger";
  multi?: false;
  value: string;
  onSelect: (label: string) => void;
};

type MultiProps = {
  options: readonly string[];
  ariaLabel: string;
  variant: "branch" | "topic";
  tone?: "gold" | "danger";
  multi: true;
  value: string[];
  onSelect: (label: string) => void;
};

type Props = SingleProps | MultiProps;

export function ChipGroup(props: Props) {
  const { options, ariaLabel, variant, tone = "gold", onSelect } = props;
  const reduce = useReducedMotion();
  const isTopic = variant === "topic";

  return (
    <div
      role={props.multi ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2.5"
    >
      {options.map((label) => {
        const on = props.multi
          ? props.value.includes(label)
          : props.value === label;
        return (
          <motion.button
            key={label}
            type="button"
            data-on={on}
            {...(props.multi
              ? { "aria-pressed": on }
              : { role: "radio", "aria-checked": on })}
            onClick={() => onSelect(label)}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            transition={springBouncy}
            className={cn(
              "pop-chip font-medium",
              tone === "danger" && "pop-chip--danger",
              isTopic
                ? "px-[18px] py-[10px] text-[15px]"
                : "px-[20px] py-[11px] text-[15px] tracking-[0.01em]",
            )}
          >
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
