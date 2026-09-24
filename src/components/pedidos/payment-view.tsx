"use client";

import { useState } from "react";
import { Check, Copy, LoaderCircle } from "lucide-react";
import { BrandTextField } from "@/components/satisfaccion/brand-field";
import type { PaymentInfo } from "@/lib/pedidos-api";
import { formatBs, formatUsd, type OrderSummary } from "./format";
import { cls, StepHeader } from "./shared";

export function PaymentView({
  order,
  payment,
  reference,
  onReference,
  onBack,
  onConfirm,
  submitting,
  error,
}: {
  order: Omit<OrderSummary, "reference">;
  payment: PaymentInfo;
  reference: string;
  onReference: (value: string) => void;
  onBack: () => void;
  /** Registra el pedido en el servidor; si sale bien, el flujo pasa a enviarlo por WhatsApp. */
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
}) {
  // Vista previa: el total definitivo lo calcula el servidor al confirmar.
  const totalBs = order.totalBs;
  const account = payment.account;

  return (
    <div className="flex flex-col gap-6 pt-6">
      <StepHeader eyebrow="Paso 3 de 3" title="Confirma y paga" onBack={onBack} />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Resumen del pedido */}
        <section className={`${cls.panel} flex flex-col gap-4 p-5 lg:sticky lg:top-6`}>
          <span className={cls.label}>Resumen</span>
          <ul className="flex flex-col gap-2.5">
            {order.items.map((item) => (
              <li key={item.lineId} className="flex justify-between gap-3 text-[16px]">
                <span className="text-body">
                  <span className="text-cream">{item.quantity} ×</span> {item.name}
                  {item.note && <span className="block text-[14px] text-muted-ink">“{item.note}”</span>}
                </span>
                <span className="shrink-0 text-cream">{formatUsd(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1.5 border-t border-hair-div pt-3 text-[16px]">
            <Row label="Subtotal" value={formatUsd(order.subtotal)} />
            {order.mode === "delivery" && order.zone ? (
              <Row label={`Delivery · ${order.zone.name}`} value={formatUsd(order.deliveryFee)} />
            ) : (
              <Row label={`Retiro · ${order.store.name}`} value="Sin costo" />
            )}
          </div>
          <div className="flex items-end justify-between border-t border-hair-div pt-3">
            <span className={cls.label}>Total</span>
            <span className="flex flex-col items-end">
              <span className="font-serif text-[34px] font-semibold leading-none text-gold-accent">{formatUsd(order.total)}</span>
              <span className="mt-1 text-[18px] font-semibold text-cream">{formatBs(totalBs)}</span>
              <span className="text-[13px] text-label">Tasa: {formatBs(payment.rate)} por $1</span>
            </span>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {/* Datos de Pago Móvil */}
          <section className={`${cls.panel} flex flex-col gap-3 p-5`}>
            <span className={cls.label}>Paga por Pago Móvil</span>
            {account ? (
              <>
                <p className="text-[15px] leading-snug text-body">
                  Transfiere <strong className="text-cream">{formatBs(totalBs)}</strong> a estos datos y luego confirma tu pedido.
                </p>
                <dl className="flex flex-col divide-y divide-hair-div">
                  <CopyRow label="Banco" value={account.bankCode ? `${account.bank} (${account.bankCode})` : account.bank} />
                  <CopyRow label="Teléfono" value={account.phone} />
                  <CopyRow label="RIF" value={account.rif} />
                  <CopyRow label="Titular" value={account.holder} />
                  <CopyRow label="Monto" value={totalBs.toFixed(2).replace(".", ",")} display={formatBs(totalBs)} />
                </dl>
              </>
            ) : (
              <p className="text-[15px] leading-snug text-body">
                Este local todavía no publicó sus datos de Pago Móvil. Confirma el pedido y te los enviamos por WhatsApp.
              </p>
            )}
          </section>

          <BrandTextField
            label="Referencia del pago (opcional)"
            inputMode="numeric"
            value={reference}
            onChange={onReference}
            placeholder="Últimos dígitos de la referencia"
          />

          {error && (
            <p role="alert" className={cls.error}>
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="lb-shine inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#1f9d55] px-9 py-[16px] text-[17px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(37,211,102,0.6)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? <LoaderCircle size={22} className="animate-spin" aria-hidden="true" /> : <WhatsappIcon />}
            {submitting ? "Registrando tu pedido…" : "Confirmar pedido"}
          </button>
          <p className="-mt-3 text-center text-[14px] text-label">
            Registramos tu pedido y después lo envías por WhatsApp con el capture del pago.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-ink">{label}</span>
      <span className="text-cream">{value}</span>
    </div>
  );
}

function CopyRow({ label, value, display }: { label: string; value: string; display?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Sin permiso de portapapeles: el dato sigue visible para copiarlo a mano.
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-[14px] uppercase tracking-[0.12em] text-label">{label}</dt>
      <dd className="flex items-center gap-2 text-[17px] text-cream">
        {display ?? value}
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="inline-flex size-9 items-center justify-center rounded-full text-label transition-colors hover:text-gold"
        >
          {copied ? <Check size={17} className="text-gold" /> : <Copy size={17} />}
        </button>
      </dd>
    </div>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.43-9.43 2.52 0 4.88.98 6.66 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.44 9.42zm8.03-17.45A11.3 11.3 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.72l6.12-1.6a11.3 11.3 0 0 0 5.33 1.36h.01c6.26 0 11.35-5.1 11.35-11.36 0-3.03-1.18-5.88-3.33-8.02z" />
    </svg>
  );
}
