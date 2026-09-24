"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bike, MapPin, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/satisfaccion/chip-group";
import { BrandTextArea, BrandTextField } from "@/components/satisfaccion/brand-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeliveryZone, Store } from "@/lib/pedidos-api";
import { formatUsd } from "./format";
import { cls, StepHeader } from "./shared";

export type CheckoutData = {
  name: string;
  phone: string;
  mode: "delivery" | "retiro";
  zoneId: string;
  address: string;
};

export const initialCheckout: CheckoutData = {
  name: "",
  phone: "",
  mode: "delivery",
  zoneId: "",
  address: "",
};

const MODES = { delivery: "Delivery", retiro: "Retiro en local" } as const;
const MODE_ICONS = { Delivery: Bike, "Retiro en local": StoreIcon };

type Errors = Partial<Record<keyof CheckoutData, string>>;

function validate(data: CheckoutData): Errors {
  const errors: Errors = {};
  if (data.name.trim().length < 2) errors.name = "Escribe tu nombre.";
  const digits = data.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) errors.phone = "Escribe un número válido. Ejemplo: 0414 123 4567.";
  if (data.mode === "delivery") {
    if (!data.zoneId) errors.zoneId = "Elige tu zona de entrega.";
    if (data.address.trim().length < 8) errors.address = "Escribe la dirección exacta con un punto de referencia.";
  }
  return errors;
}

const selectTrigger =
  "pop-input h-auto w-full rounded-[16px] border-0 px-4 py-[13px] text-[17px] text-cream data-placeholder:text-placeholder dark:bg-transparent";
const selectContent = "pedidos-scroll rounded-[16px] border border-hair-div bg-[#16110c] p-1 text-cream";
const selectItem = "rounded-[12px] py-2.5 pl-3 text-[16px] focus:bg-[rgba(217,169,74,0.16)] focus:text-cream";

export function CheckoutForm({
  data,
  onChange,
  zones,
  store,
  onBack,
  onContinue,
}: {
  data: CheckoutData;
  onChange: (data: CheckoutData) => void;
  zones: DeliveryZone[];
  /** Local del pedido: define los modos disponibles y dónde se retira. */
  store: Store;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const set = <K extends keyof CheckoutData>(key: K, value: CheckoutData[K]) => {
    onChange({ ...data, [key]: value });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const modes = [
    ...(store.deliveryEnabled ? [MODES.delivery] : []),
    ...(store.pickupEnabled ? [MODES.retiro] : []),
  ];

  const submit = () => {
    const next = validate(data);
    setErrors(next);
    if (Object.keys(next).length === 0) onContinue();
  };

  return (
    <div className="flex flex-col gap-6 pt-6">
      <StepHeader eyebrow="Paso 2 de 3" title="Tus datos" onBack={onBack} />

      <div className="flex flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={errors.name}>
            <BrandTextField label="Nombre" value={data.name} onChange={(v) => set("name", v)} autoComplete="name" placeholder="Nombre y apellido" />
          </Field>
          <Field error={errors.phone}>
            <BrandTextField
              label="Teléfono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={data.phone}
              onChange={(v) => set("phone", v)}
              placeholder="0414 123 4567"
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <span className={cls.label}>¿Cómo lo quieres?</span>
          <ChipGroup
            variant="branch"
            ariaLabel="Modalidad de entrega"
            options={modes}
            icons={MODE_ICONS}
            value={MODES[data.mode]}
            onSelect={(label) => set("mode", label === MODES.delivery ? "delivery" : "retiro")}
          />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {data.mode === "delivery" ? (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-5"
            >
              <Field error={errors.zoneId}>
                <div className="flex flex-col gap-2">
                  <span id="zona-label" className={cls.label}>Zona de entrega</span>
                  <Select
                    value={data.zoneId || null}
                    onValueChange={(v) => set("zoneId", (v as string | null) ?? "")}
                    items={zones.map((z) => ({ value: z.id, label: `${z.name} · ${formatUsd(z.price)}` }))}
                  >
                    <SelectTrigger aria-labelledby="zona-label" className={selectTrigger}>
                      <SelectValue placeholder="Elige tu zona" />
                    </SelectTrigger>
                    <SelectContent className={selectContent}>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id} className={selectItem}>
                          <span className="flex-1">{zone.name}</span>
                          <span className="text-gold-accent">{formatUsd(zone.price)}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Field>
              <Field error={errors.address}>
                <BrandTextArea
                  label="Dirección exacta"
                  value={data.address}
                  onChange={(v) => set("address", v)}
                  placeholder="Calle, edificio o casa, piso, y un punto de referencia"
                  rows={3}
                />
              </Field>
            </motion.div>
          ) : (
            <motion.div
              key="retiro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex gap-3 rounded-[16px] border border-hair-div px-4 py-3">
                <MapPin size={20} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                <span className="flex flex-col">
                  <span className="text-[17px] text-cream">Retiras en {store.name}</span>
                  {store.address && <span className="text-[14px] text-muted-ink">{store.address}</span>}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button variant="pop" size="popLg" className="w-full md:ml-auto md:w-[360px]" onClick={submit}>
        Ir al pago
      </Button>
    </div>
  );
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {children}
      {error && (
        <p role="alert" className={cls.error}>
          {error}
        </p>
      )}
    </div>
  );
}
