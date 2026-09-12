"use client";

import * as React from "react";
import { cn } from "cn";
import { RANGES, type RangeKey } from "@/lib/mock";
import { SUCURSALES } from "@/components/satisfaccion/survey-data";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-on={active}
      className={cn(
        "lb-chip px-3.5 py-1.5 text-[12px] font-medium tracking-[0.14em]",
        "transition-transform active:scale-[0.97]",
      )}
    >
      <span className="lb-chip__fill" aria-hidden="true" />
      <span className="lb-chip__label">{children}</span>
    </button>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11px] uppercase tracking-[0.24em] text-label">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export function FilterBar({
  range,
  onRange,
  sucursal,
  onSucursal,
}: {
  range: RangeKey;
  onRange: (r: RangeKey) => void;
  sucursal: string | "all";
  onSucursal: (s: string | "all") => void;
}) {
  return (
    <div className="flex flex-col gap-3 @3xl/dash:flex-row @3xl/dash:items-center @3xl/dash:justify-between">
      <Group label="Periodo">
        {RANGES.map((r) => (
          <Chip
            key={r.key}
            active={range === r.key}
            onClick={() => onRange(r.key)}
          >
            {r.label}
          </Chip>
        ))}
      </Group>
      <Group label="Sucursal">
        <Chip active={sucursal === "all"} onClick={() => onSucursal("all")}>
          Todas
        </Chip>
        {SUCURSALES.map((s) => (
          <Chip
            key={s}
            active={sucursal === s}
            onClick={() => onSucursal(s)}
          >
            {s}
          </Chip>
        ))}
      </Group>
    </div>
  );
}
