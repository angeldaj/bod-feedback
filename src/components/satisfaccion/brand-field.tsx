"use client";

import { useId, type Ref } from "react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Reset shadcn/base-ui styles and hand over to the .pop-input look.
const inputReset =
  "pop-input border-0 focus-visible:ring-0 aria-invalid:ring-0 text-cream md:text-[17px]";

const labelCls =
  "text-[13px] font-medium uppercase tracking-[0.14em] text-label transition-colors group-focus-within:text-coral";

type BaseProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Marca el campo como opcional junto a la etiqueta. */
  optional?: boolean;
  /** Ayuda persistente bajo el campo. */
  hint?: string;
  /** Error bajo el campo (reemplaza la ayuda mientras exista). */
  error?: string | null;
  maxLength?: number;
};

function FieldLabel({ id, label, optional }: { id: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={id} className={labelCls}>
      {label}
      {optional && <span className="ml-1.5 normal-case tracking-normal text-muted-ink">(opcional)</span>}
    </label>
  );
}

function FieldNote({ id, hint, error }: { id: string; hint?: string; error?: string | null }) {
  if (error) {
    return (
      <p id={id} role="alert" className="text-[14px] font-medium leading-[1.4] text-coral">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="text-[14px] leading-[1.45] text-muted-ink">
        {hint}
      </p>
    );
  }
  return null;
}

export function BrandTextField({
  label,
  value,
  onChange,
  placeholder,
  optional,
  hint,
  error,
  maxLength,
  autoComplete,
  type = "text",
  inputMode,
  prefix,
  inputRef,
  onBlur,
}: BaseProps & {
  autoComplete?: string;
  type?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  /** Texto fijo antes del valor (p. ej. "+58"). */
  prefix?: string;
  inputRef?: Ref<HTMLInputElement>;
  onBlur?: () => void;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const hasNote = Boolean(error || hint);
  return (
    <div className="group flex flex-col gap-2">
      <FieldLabel id={id} label={label} optional={optional} />
      <div className="relative">
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-hair-div pr-3 pl-4 text-[17px] font-semibold text-cream"
          >
            {prefix}
          </span>
        )}
        <Input
          id={id}
          ref={inputRef}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasNote ? noteId : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cn(
            inputReset,
            "h-auto min-h-12 px-4 py-[12px] text-[17px] leading-normal",
            prefix && "pl-[72px]",
            error && "!border-coral",
          )}
        />
      </div>
      <FieldNote id={noteId} hint={hint} error={error} />
    </div>
  );
}

export function BrandTextArea({
  label,
  value,
  onChange,
  placeholder,
  optional,
  hint,
  error,
  maxLength,
  rows = 5,
}: BaseProps & { rows?: number }) {
  const id = useId();
  const noteId = `${id}-note`;
  const hasNote = Boolean(error || hint);
  return (
    <div className="group flex flex-col gap-2">
      <FieldLabel id={id} label={label} optional={optional} />
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={hasNote ? noteId : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          inputReset,
          "min-h-0 resize-y px-4 py-3.5 text-[17px] leading-[1.5] [field-sizing:fixed]",
          error && "!border-coral",
        )}
      />
      <FieldNote id={noteId} hint={hint} error={error} />
    </div>
  );
}
