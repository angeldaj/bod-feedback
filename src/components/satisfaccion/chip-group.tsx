"use client";

import { cn } from "cn";

type SingleProps = {
  options: readonly string[];
  ariaLabel: string;
  variant: "branch" | "topic";
  multi?: false;
  value: string;
  onSelect: (label: string) => void;
};

type MultiProps = {
  options: readonly string[];
  ariaLabel: string;
  variant: "branch" | "topic";
  multi: true;
  value: string[];
  onSelect: (label: string) => void;
};

type Props = SingleProps | MultiProps;

export function ChipGroup(props: Props) {
  const { options, ariaLabel, variant, onSelect } = props;
  const isTopic = variant === "topic";

  return (
    <div
      role={props.multi ? "group" : "radiogroup"}
      aria-label={ariaLabel}
      className="flex flex-wrap gap-3"
    >
      {options.map((label) => {
        const on = props.multi
          ? props.value.includes(label)
          : props.value === label;
        return (
          <button
            key={label}
            type="button"
            data-on={on}
            {...(props.multi
              ? { "aria-pressed": on }
              : { role: "radio", "aria-checked": on })}
            onClick={() => onSelect(label)}
            className={cn(
              "lb-chip",
              isTopic
                ? "px-[22px] py-[11px] text-[15px] tracking-[0.12em]"
                : "px-[26px] py-[13px] text-base tracking-[0.14em]",
            )}
          >
            <span className="lb-chip__fill" aria-hidden="true" />
            <span className="lb-chip__label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
