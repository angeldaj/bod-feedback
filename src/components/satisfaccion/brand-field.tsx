"use client";

import { useId } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Reset shadcn/base-ui styles and hand over to the .pop-input look.
const inputReset =
  "pop-input border-0 focus-visible:ring-0 text-cream md:text-[17px]";

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
  inputMode,
}: BaseProps & {
  autoComplete?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  const id = useId();
  return (
    <div className="group flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[13px] font-medium uppercase tracking-[0.14em] text-label transition-colors group-focus-within:text-coral"
      >
        {label}
      </label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputReset, "h-auto px-4 py-[13px] text-[17px] leading-normal")}
      />
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
    <div className="group flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[13px] font-medium uppercase tracking-[0.14em] text-label transition-colors group-focus-within:text-coral"
      >
        {label}
      </label>
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          inputReset,
          "min-h-0 resize-y px-4 py-3.5 text-[17px] leading-[1.5] [field-sizing:fixed]",
        )}
      />
    </div>
  );
}
