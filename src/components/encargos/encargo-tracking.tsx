"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Check, LoaderCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandTextArea, BrandTextField } from "@/components/satisfaccion/brand-field";
import { PedidosApiError } from "@/lib/pedidos-api";
import {
  acceptEncargo,
  fetchEncargo,
  rejectEncargo,
  requestEncargoChanges,
  type Encargo,
  type EncargoStatus,
} from "@/lib/encargos-api";
import { formatBs, formatUsd } from "@/components/pedidos/format";
import { CopyRow } from "@/components/pedidos/payment-view";
import { cls } from "@/components/pedidos/shared";
import { formatWhen, MAX_NOTE_LENGTH, statusLabel } from "./encargo-format";

const REFRESH_MS = 60_000;

/** Pasos del camino feliz; los estados cerrados en negativo se muestran aparte. */
const TIMELINE: { status: EncargoStatus; label: string }[] = [
  { status: "requested", label: "Recibido" },
  { status: "quoted", label: "Cotizado" },
  { status: "confirmed", label: "Confirmado" },
  { status: "preparing", label: "En preparación" },
  { status: "ready", label: "Listo" },
  { status: "delivered", label: "Entregado" },
];
const TIMELINE_INDEX: Partial<Record<EncargoStatus, number>> = {
  requested: 0,
  quoted: 1,
  accepted: 1,
  confirmed: 2,
  preparing: 3,
  ready: 4,
  delivered: 5,
};

type LoadState = { kind: "loading" } | { kind: "missing" } | { kind: "error" } | { kind: "ready"; encargo: Encargo };

/** Seguimiento de un encargo por su token: estado, cotización y respuesta del cliente. */
export function EncargoTracking({ token }: { token: string }) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    try {
      setState({ kind: "ready", encargo: await fetchEncargo(token) });
    } catch (error) {
      setState((current) =>
        error instanceof PedidosApiError && error.status === 404
          ? { kind: "missing" }
          : current.kind === "ready"
            ? current // Un refresco fallido no borra lo que ya se ve.
            : { kind: "error" },
      );
    }
  }, [token]);

  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden="true" className="pop-page-base" />
      <div aria-hidden="true" className="pop-page-glow pop-page-glow--warm" />
      <main className="pedidos-root relative z-[1] mx-auto flex min-h-dvh w-full max-w-[760px] flex-col gap-6 px-4 pt-6 pb-24 md:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link href="/encargos" className="flex flex-col gap-1">
            <span className="font-serif text-[26px] font-semibold leading-none tracking-tight text-cream">La Bodega</span>
            <span className="pl-[0.1em] text-[10.5px] font-medium uppercase tracking-[0.28em] text-label">Encargos</span>
          </Link>
        </header>

        {state.kind === "loading" && (
          <div className="flex flex-col gap-3" role="status" aria-label="Cargando tu encargo">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-[22px] bg-[rgba(247,242,231,0.05)]" />
            ))}
          </div>
        )}
        {state.kind === "missing" && (
          <Message title="No encontramos este encargo">
            Revisa que el link esté completo. Si lo copiaste de WhatsApp, ábrelo desde ahí.
          </Message>
        )}
        {state.kind === "error" && (
          <Message title="No pudimos cargar tu encargo">
            Revisa tu conexión e intenta de nuevo.
            <Button variant="popGhost" size="popMd" className="mt-4" onClick={() => void load()}>
              Reintentar
            </Button>
          </Message>
        )}
        {state.kind === "ready" && (
          <EncargoView token={token} encargo={state.encargo} onChange={(encargo) => setState({ kind: "ready", encargo })} />
        )}
      </main>
    </MotionConfig>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${cls.panel} flex flex-col items-center gap-2 px-6 py-12 text-center`}>
      <h1 className="text-[22px] font-semibold text-cream">{title}</h1>
      <div className="flex flex-col items-center text-[16px] text-body">{children}</div>
    </div>
  );
}

function statusMessage(encargo: Encargo): string {
  const when = formatWhen(encargo.scheduledFor ?? encargo.requestedFor);
  switch (encargo.status) {
    case "requested":
      return "Un asesor está revisando tu encargo. Te escribimos por WhatsApp cuando tenga precio.";
    case "quoted":
      return encargo.quote
        ? `Revisa la cotización y acéptala antes del ${formatWhen(encargo.quote.validUntil)}.`
        : "Revisa la cotización.";
    case "accepted":
      return "Recibimos tu referencia. Estamos verificando el abono y te confirmamos por WhatsApp.";
    case "confirmed":
      return `Tu encargo está confirmado para el ${when}.`;
    case "preparing":
      return `Lo estamos preparando para el ${when}.`;
    case "ready":
      return encargo.mode === "pickup" ? `Ya puedes retirarlo en ${encargo.storeName}.` : "Tu encargo va en camino.";
    case "delivered":
      return "¡Gracias por elegirnos! Esperamos que lo disfrutes.";
    case "rejected":
      return "Rechazaste esta cotización. Si cambias de opinión, escríbenos por WhatsApp.";
    case "expired":
      return "La cotización venció. Escríbenos por WhatsApp si todavía lo necesitas y te enviamos una nueva.";
    case "cancelled":
      return encargo.cancelReason ? `Cancelamos este encargo: ${encargo.cancelReason}` : "Este encargo fue cancelado.";
  }
}

function EncargoView({ token, encargo, onChange }: { token: string; encargo: Encargo; onChange: (encargo: Encargo) => void }) {
  const step = TIMELINE_INDEX[encargo.status];
  const whatsapp = encargo.storeWhatsapp
    ? `https://wa.me/${encargo.storeWhatsapp}?text=${encodeURIComponent(`Hola, les escribo por mi encargo ${encargo.code}.`)}`
    : null;

  return (
    <>
      <section className="flex flex-col gap-2">
        <span className={cls.eyebrow}>Encargo {encargo.code}</span>
        <h1 className={cls.title}>{statusLabel(encargo.status, encargo.mode)}</h1>
        <p className="text-[17px] leading-relaxed text-body">{statusMessage(encargo)}</p>
      </section>

      {step !== undefined && (
        <ol className="grid grid-cols-6 gap-1.5" aria-label="Avance del encargo">
          {TIMELINE.map((item, index) => (
            <li key={item.status} className="flex flex-col gap-1.5">
              <span className={`h-1.5 rounded-full ${index <= step ? "bg-gold" : "bg-[rgba(247,242,231,0.12)]"}`} />
              <span className={`hidden text-[12px] sm:block ${index <= step ? "text-cream" : "text-label"}`}>{item.label}</span>
              <span className="sr-only">{index <= step ? `${item.label}: hecho` : `${item.label}: pendiente`}</span>
            </li>
          ))}
        </ol>
      )}

      {encargo.status === "quoted" && encargo.quote && <QuoteActions token={token} encargo={encargo} onChange={onChange} />}

      <Details encargo={encargo} />

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 self-center text-[15px] font-semibold text-gold underline-offset-4 hover:underline"
        >
          <MessageCircle size={18} aria-hidden="true" />
          Escríbele a {encargo.storeName}
        </a>
      )}
    </>
  );
}

function Details({ encargo }: { encargo: Encargo }) {
  const quote = encargo.quote;
  return (
    <section className={`${cls.panel} flex flex-col gap-4 p-5`}>
      <div className="flex flex-col gap-1">
        <span className={cls.label}>Para el</span>
        <span className="text-[18px] text-cream first-letter:uppercase">{formatWhen(encargo.scheduledFor ?? encargo.requestedFor)}</span>
        {encargo.scheduledFor && encargo.scheduledFor !== encargo.requestedFor && (
          <span className="text-[14px] text-muted-ink">Lo pediste para el {formatWhen(encargo.requestedFor)}; el asesor ajustó la hora.</span>
        )}
        <span className="text-[15px] text-body">
          {encargo.mode === "delivery"
            ? `Delivery · ${encargo.zoneName ?? ""}${encargo.address ? ` · ${encargo.address}` : ""}`
            : `Retiro en ${encargo.storeName}`}
        </span>
      </div>

      {encargo.items.length > 0 && (
        <ul className="flex flex-col gap-2.5 border-t border-hair-div pt-4">
          {encargo.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-[16px]">
              <span className="text-body">
                <span className="text-cream">{item.quantity} ×</span> {item.name}
                {item.note && <span className="block text-[14px] text-muted-ink">“{item.note}”</span>}
              </span>
              {item.lineTotalUsd !== null && <span className="shrink-0 text-cream">{formatUsd(item.lineTotalUsd)}</span>}
            </li>
          ))}
        </ul>
      )}

      {encargo.customerNote && (
        <div className="flex flex-col gap-1 border-t border-hair-div pt-4">
          <span className={cls.label}>Tu nota</span>
          <p className="whitespace-pre-line text-[16px] text-body">{encargo.customerNote}</p>
        </div>
      )}
      {encargo.status === "requested" && encargo.customerResponseNote && (
        <div className="flex flex-col gap-1 border-t border-hair-div pt-4">
          <span className={cls.label}>Cambios que pediste</span>
          <p className="whitespace-pre-line text-[16px] text-body">{encargo.customerResponseNote}</p>
        </div>
      )}

      {quote && (
        <div className="flex flex-col gap-1.5 border-t border-hair-div pt-4 text-[16px]">
          <Row label="Subtotal" value={formatUsd(quote.subtotalUsd)} />
          {encargo.mode === "delivery" && <Row label="Delivery" value={formatUsd(quote.deliveryFeeUsd)} />}
          <div className="flex items-end justify-between pt-2">
            <span className={cls.label}>Total</span>
            <span className="flex flex-col items-end">
              <span className="font-serif text-[30px] font-semibold leading-none text-gold-accent">{formatUsd(quote.totalUsd)}</span>
              {encargo.bs && <span className="mt-1 text-[16px] font-semibold text-cream">{formatBs(encargo.bs.totalBs)}</span>}
            </span>
          </div>
          {quote.depositUsd > 0 && (
            <>
              <Row
                label={`Abono (${quote.depositPercent} %)`}
                value={`${formatUsd(quote.depositUsd)}${encargo.bs ? ` · ${formatBs(encargo.bs.depositBs)}` : ""}`}
              />
              <Row label="Saldo al recibirlo" value={encargo.balancePaid ? "Pagado" : formatUsd(quote.balanceUsd)} />
            </>
          )}
          {encargo.bs && (
            <span className="text-[13px] text-label">
              Tasa {encargo.bs.frozen ? "del día que aceptaste" : "de hoy"}: {formatBs(encargo.bs.rate)} por $1
            </span>
          )}
          {quote.advisorNote && (
            <p className="mt-2 rounded-[16px] bg-[rgba(217,169,74,0.08)] px-4 py-3 text-[15px] leading-snug text-body">
              <span className="font-semibold text-cream">Nota del asesor:</span> {quote.advisorNote}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-ink">{label}</span>
      <span className="text-right text-cream">{value}</span>
    </div>
  );
}

type Mode = "accept" | "changes" | "reject";

function QuoteActions({ token, encargo, onChange }: { token: string; encargo: Encargo; onChange: (encargo: Encargo) => void }) {
  const quote = encargo.quote!;
  const needsDeposit = quote.depositUsd > 0;
  const [mode, setMode] = useState<Mode>("accept");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<Encargo>) {
    setBusy(true);
    setError(null);
    try {
      onChange(await action());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof PedidosApiError && err.status < 500
          ? err.message
          : "No pudimos enviar tu respuesta. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  function accept() {
    if (needsDeposit && !reference.trim()) {
      setError("Escribe la referencia del pago móvil del abono.");
      return;
    }
    void run(() => acceptEncargo(token, reference.trim() || undefined));
  }

  function sendChanges() {
    if (note.trim().length < 3) {
      setError("Cuéntanos qué quieres cambiar.");
      return;
    }
    void run(() => requestEncargoChanges(token, note.trim()));
  }

  const depositBs = encargo.bs?.depositBs ?? null;

  return (
    <section className={`${cls.panel} flex flex-col gap-4 p-5`}>
      <div role="tablist" aria-label="Tu respuesta" className="flex flex-wrap gap-2">
        {(
          [
            ["accept", "Aceptar"],
            ["changes", "Pedir cambios"],
            ["reject", "Rechazar"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            data-on={mode === key}
            onClick={() => {
              setMode(key);
              setError(null);
            }}
            className="pop-chip px-[18px] py-[9px] text-[15px] font-medium"
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          {mode === "accept" &&
            (needsDeposit ? (
              <>
                <p className="text-[15px] leading-snug text-body">
                  Para confirmar tu encargo, paga el abono de{" "}
                  <strong className="text-cream">{depositBs !== null ? formatBs(depositBs) : formatUsd(quote.depositUsd)}</strong> por
                  Pago Móvil y escribe la referencia.
                </p>
                {encargo.payment ? (
                  <dl className="flex flex-col divide-y divide-hair-div">
                    <CopyRow label="Banco" value={encargo.payment.bank} />
                    <CopyRow label="Teléfono" value={encargo.payment.phone} />
                    <CopyRow label="RIF" value={encargo.payment.rif} />
                    <CopyRow label="Titular" value={encargo.payment.holder} />
                    {depositBs !== null && (
                      <CopyRow label="Monto" value={depositBs.toFixed(2).replace(".", ",")} display={formatBs(depositBs)} />
                    )}
                  </dl>
                ) : (
                  <p className="text-[15px] text-body">Escríbenos por WhatsApp y te pasamos los datos de pago.</p>
                )}
                <BrandTextField
                  label="Referencia del pago"
                  inputMode="numeric"
                  value={reference}
                  onChange={setReference}
                  placeholder="Últimos dígitos de la referencia"
                  maxLength={40}
                />
              </>
            ) : (
              <p className="text-[15px] leading-snug text-body">
                Esta cotización no lleva abono. Al aceptarla, tu encargo queda confirmado.
              </p>
            ))}
          {mode === "changes" && (
            <BrandTextArea
              label="¿Qué quieres cambiar?"
              value={note}
              onChange={setNote}
              maxLength={MAX_NOTE_LENGTH}
              rows={3}
              placeholder="Ej.: mejor de vainilla, para 30 personas, o a las 4 p. m."
              hint="El asesor revisa tu pedido y te envía una cotización nueva."
            />
          )}
          {mode === "reject" && (
            <BrandTextArea
              label="¿Por qué? (opcional)"
              value={note}
              onChange={setNote}
              maxLength={MAX_NOTE_LENGTH}
              rows={2}
              placeholder="Nos ayuda a mejorar"
            />
          )}

          {error && (
            <p role="alert" className={cls.error}>
              {error}
            </p>
          )}

          {mode === "accept" && (
            <Button variant="pop" size="popLg" className="w-full" onClick={accept} disabled={busy}>
              {busy ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <Check size={20} aria-hidden="true" />}
              {needsDeposit ? "Aceptar y reportar abono" : "Aceptar cotización"}
            </Button>
          )}
          {mode === "changes" && (
            <Button variant="pop" size="popLg" className="w-full" onClick={sendChanges} disabled={busy}>
              {busy ? "Enviando…" : "Enviar cambios"}
            </Button>
          )}
          {mode === "reject" && (
            <Button
              variant="popGhost"
              size="popLg"
              className="w-full"
              onClick={() => void run(() => rejectEncargo(token, note.trim() || undefined))}
              disabled={busy}
            >
              {busy ? "Enviando…" : "Rechazar cotización"}
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
