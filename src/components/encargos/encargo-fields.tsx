"use client";

import { useMemo } from "react";
import { BrandTextArea } from "@/components/satisfaccion/brand-field";
import { cls } from "@/components/pedidos/shared";
import { dateBounds, MAX_NOTE_LENGTH, MIN_LEAD_HOURS } from "./encargo-format";

export type EncargoExtra = { date: string; time: string; note: string };

export const initialExtra: EncargoExtra = { date: "", time: "", note: "" };

const nativeInput =
  "pop-input h-auto min-h-12 w-full px-4 py-[12px] text-[17px] text-cream [color-scheme:dark]";

/** Fecha, hora y nota para el asesor: lo que el encargo agrega a los datos del pedido. */
export function EncargoFields({
  value,
  onChange,
  errors,
  hasItems,
}: {
  value: EncargoExtra;
  onChange: (value: EncargoExtra) => void;
  errors: { when?: string | null; note?: string | null };
  /** Sin productos, la nota es la que describe el encargo. */
  hasItems: boolean;
}) {
  const bounds = useMemo(() => dateBounds(), []);
  const set = <K extends keyof EncargoExtra>(key: K, next: EncargoExtra[K]) => onChange({ ...value, [key]: next });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className={cls.label}>¿Para cuándo lo necesitas?</span>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Día</span>
            <input
              type="date"
              min={bounds.min}
              max={bounds.max}
              value={value.date}
              onChange={(e) => set("date", e.target.value)}
              aria-invalid={errors.when ? true : undefined}
              className={nativeInput}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="sr-only">Hora</span>
            <input
              type="time"
              step={900}
              value={value.time}
              onChange={(e) => set("time", e.target.value)}
              aria-invalid={errors.when ? true : undefined}
              className={nativeInput}
            />
          </label>
        </div>
        {errors.when ? (
          <p role="alert" className={cls.error}>
            {errors.when}
          </p>
        ) : (
          <p className="text-[14px] leading-[1.45] text-muted-ink">
            Con al menos {MIN_LEAD_HOURS} horas de anticipación. Si la hora no nos da, el asesor te propone otra.
          </p>
        )}
      </div>

      <BrandTextArea
        label={hasItems ? "Nota para el asesor" : "¿Qué necesitas?"}
        optional={hasItems}
        value={value.note}
        onChange={(next) => set("note", next)}
        maxLength={MAX_NOTE_LENGTH}
        rows={4}
        placeholder={
          hasItems
            ? "Cambios, decoración, algo que no está en el catálogo…"
            : "Ej.: torta de chocolate de 2 kg para 20 personas, con el nombre “Ana” en dorado."
        }
        hint="Todo lo que no está en el catálogo, cuéntalo aquí: lo cotizamos igual."
        error={errors.note}
      />
    </div>
  );
}
