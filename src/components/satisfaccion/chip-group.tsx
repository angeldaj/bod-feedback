"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { springBouncy } from "./motion";

type BaseProps = {
  /** Valores (claves) de las opciones. Se muestran con `labels[value]` o tal cual. */
  options: readonly string[];
  labels?: Record<string, string>;
  ariaLabel: string;
  variant: "branch" | "topic";
  tone?: "gold" | "danger";
  /** Icono opcional por valor. Se pinta antes del texto. */
  icons?: Record<string, LucideIcon>;
  /** Multi-select: muestra un check en las opciones elegidas. */
  checkOnSelected?: boolean;
  /** Id del mensaje de error/ayuda asociado al grupo. */
  describedBy?: string;
  invalid?: boolean;
  onSelect: (value: string) => void;
};

type SingleProps = BaseProps & { multi?: false; value: string };
type MultiProps = BaseProps & { multi: true; value: readonly string[] };

type Props = SingleProps | MultiProps;

export function ChipGroup(props: Props) {
  const {
    options,
    labels,
    ariaLabel,
    variant,
    tone = "gold",
    icons,
    checkOnSelected,
    describedBy,
    invalid,
    onSelect,
  } = props;
  const reduce = useReducedMotion();
  const isTopic = variant === "topic";
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  // Radiogroup: una sola parada de Tab (la elegida, o la primera) y flechas
  // para moverse y elegir, como un grupo de radios nativo.
  const selectedIndex = props.multi ? -1 : options.indexOf(props.value);
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    if (props.multi) return;
    const delta =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!delta) return;
    e.preventDefault();
    const target = (i + delta + options.length) % options.length;
    refs.current[target]?.focus();
    onSelect(options[target]);
  }

  return (
    <div
      role={props.multi ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      aria-invalid={!props.multi && invalid ? true : undefined}
      aria-required={!props.multi ? true : undefined}
      className="flex flex-wrap gap-2.5"
    >
      {options.map((value, i) => {
        const on = props.multi ? props.value.includes(value) : props.value === value;
        const Icon = icons?.[value];
        return (
          <motion.button
            key={value}
            ref={(node) => {
              refs.current[i] = node;
            }}
            type="button"
            data-on={on}
            data-invalid={invalid || undefined}
            {...(props.multi
              ? { "aria-pressed": on }
              : { role: "radio", "aria-checked": on, tabIndex: i === tabStop ? 0 : -1 })}
            onClick={() => onSelect(value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            transition={springBouncy}
            className={cn(
              "pop-chip inline-flex min-h-11 items-center gap-2 text-left font-medium",
              tone === "danger" && "pop-chip--danger",
              isTopic
                ? "px-[18px] py-[9px] text-[15px] leading-[1.25]"
                : "px-[20px] py-[10px] text-[15px] tracking-[0.01em]",
            )}
          >
            {checkOnSelected && on ? (
              <motion.span
                key="check"
                initial={reduce ? false : { scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={springBouncy}
                className="grid shrink-0 place-items-center"
                aria-hidden="true"
              >
                <Check size={16} strokeWidth={2.6} />
              </motion.span>
            ) : Icon ? (
              <motion.span
                animate={reduce ? undefined : { scale: on ? 1.1 : 1, y: on ? -1 : 0 }}
                transition={springBouncy}
                className="grid shrink-0 place-items-center"
                aria-hidden="true"
              >
                <Icon size={17} strokeWidth={2} />
              </motion.span>
            ) : null}
            {labels?.[value] ?? value}
          </motion.button>
        );
      })}
    </div>
  );
}
