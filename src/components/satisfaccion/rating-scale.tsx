"use client";

import { useRef, useState } from "react";
import { cn } from "cn";

type Props = {
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
  variant?: "overall" | "dots";
};

export function RatingScale({ value, onChange, ariaLabel, variant = "overall" }: Props) {
  const [preview, setPreview] = useState(0);
  const [popN, setPopN] = useState(0);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDots = variant === "dots";

  function select(n: number) {
    onChange(n);
    setPopN(n);
    if (popTimer.current) clearTimeout(popTimer.current);
    popTimer.current = setTimeout(() => setPopN(0), 340);
  }

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
    select(target + 1);
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap", isDots ? "gap-2" : "gap-[14px]")}
      onMouseLeave={() => setPreview(0)}
    >
      {[1, 2, 3, 4, 5].map((n, i) => {
        const filled = n <= value;
        const isPreview = preview > 0 && n <= preview && n > value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} de 5`}
            data-filled={filled}
            data-preview={isPreview}
            ref={(node) => {
              btnRefs.current[i] = node;
            }}
            tabIndex={value === 0 ? (n === 1 ? 0 : -1) : n === value ? 0 : -1}
            onMouseEnter={() => setPreview(n)}
            onClick={() => select(n)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "lb-rate",
              popN === n && "lb-pop",
              isDots
                ? "h-[38px] w-[38px] font-sans text-[15px]"
                : "h-[88px] w-[88px] text-[30px] max-[560px]:h-16 max-[560px]:w-16 max-[560px]:text-[26px]",
            )}
          >
            <span className="lb-rate__fill" aria-hidden="true" />
            <span className="lb-rate__num">{n}</span>
          </button>
        );
      })}
    </div>
  );
}
