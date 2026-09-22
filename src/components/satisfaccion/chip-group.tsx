"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { springBouncy } from "./motion";

type SingleProps = {
  options: readonly string[];
  ariaLabel: string;
  variant: "branch" | "topic";
  tone?: "gold" | "danger";
  /** Optional icon per option label. Renders before the text. */
  icons?: Record<string, LucideIcon>;
  /** Multi-select: show a check on the chosen chips. */
  checkOnSelected?: boolean;
  multi?: false;
  value: string;
  onSelect: (label: string) => void;
};

type MultiProps = {
  options: readonly string[];
  ariaLabel: string;
  variant: "branch" | "topic";
  tone?: "gold" | "danger";
  icons?: Record<string, LucideIcon>;
  checkOnSelected?: boolean;
  multi: true;
  value: string[];
  onSelect: (label: string) => void;
};

type Props = SingleProps | MultiProps;

export function ChipGroup(props: Props) {
  const { options, ariaLabel, variant, tone = "gold", icons, checkOnSelected, onSelect } = props;
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
        const Icon = icons?.[label];
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
              "pop-chip inline-flex items-center gap-2 font-medium",
              tone === "danger" && "pop-chip--danger",
              isTopic
                ? "px-[18px] py-[10px] text-[15px]"
                : "px-[20px] py-[11px] text-[15px] tracking-[0.01em]",
            )}
          >
            {checkOnSelected && on ? (
              <motion.span
                key="check"
                initial={reduce ? false : { scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={springBouncy}
                className="grid place-items-center"
                aria-hidden="true"
              >
                <Check size={16} strokeWidth={2.6} />
              </motion.span>
            ) : Icon ? (
              <motion.span
                animate={reduce ? undefined : { scale: on ? 1.1 : 1, y: on ? -1 : 0 }}
                transition={springBouncy}
                className="grid place-items-center"
                aria-hidden="true"
              >
                <Icon size={17} strokeWidth={2} />
              </motion.span>
            ) : null}
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}
