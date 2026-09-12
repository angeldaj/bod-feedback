"use client";

import { useId } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const inputReset =
  "rounded-none border-hair-chip bg-[color:var(--lb-input)] text-cream " +
  "focus-visible:ring-0 focus-visible:border-gold " +
  "focus-visible:bg-[rgba(247,242,231,0.06)] md:text-[18px]";

type BaseProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export function BrandTextField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  type = "text",
}: BaseProps & { autoComplete?: string; type?: string }) {
  const id = useId();
  return (
    <div className="lb-field group flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[13px] uppercase tracking-[0.28em] text-label transition-colors group-focus-within:text-gold-accent"
      >
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputReset, "h-auto px-4 py-[14px] text-[18px] leading-normal")}
        />
        <span className="lb-underline" aria-hidden="true" />
      </div>
    </div>
  );
}

export function BrandTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: BaseProps & { rows?: number }) {
  const id = useId();
  return (
    <div className="lb-field group flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[13px] uppercase tracking-[0.28em] text-label transition-colors group-focus-within:text-gold-accent"
      >
        {label}
      </label>
      <div className="relative">
        <Textarea
          id={id}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            inputReset,
            "min-h-0 resize-y px-[18px] py-4 text-[18px] leading-[1.5] [field-sizing:fixed]",
          )}
        />
        <span className="lb-underline" aria-hidden="true" />
      </div>
    </div>
  );
}
