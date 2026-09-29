"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { ChevronRight, CircleAlert, Clock3, RotateCw, Wallet } from "lucide-react";
import { ClubApiError, type SpinResult, type SpinSegment, type SpinState, type SpinWheel } from "@/lib/club-api";
import { useClub } from "../club-provider";
import { WheelIcon, expiryLabel, fmtPts, shortDate } from "../club-visuals";
import { Skeleton } from "../pieces";
import { SegmentGlyph, SpinProgress, Wheel, segmentTone, sortedSegments, useWheelSpin } from "../wheel";

type Phase = "idle" | "spinning" | "revealed" | "error";

/** Clave de idempotencia por intento de giro (se reusa al reintentar ese mismo intento). */
function newAttemptKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buzz(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
  } catch {
    // Sin vibración no pasa nada: es un extra.
  }
}

const spinsLabel = (n: number) => (n === 1 ? "1 tirada" : `${n} tiradas`);

export function RuletaScreen() {
  const { spins, spinsLoaded, href } = useClub();

  if (!spins?.wheel) {
    if (!spinsLoaded) {
      return (
        <div className="view view-ruleta" aria-busy="true">
          <Skeleton height={72} />
          <Skeleton height={340} />
        </div>
      );
    }
    return (
      <div className="view">
        <div className="v-head">
          <h1>Ruleta</h1>
        </div>
        <div className="empty">
          <WheelIcon aria-hidden="true" />
          <b>La ruleta no está disponible en este momento.</b>
          <span>Tus tiradas no vencen: te esperan para cuando vuelva.</span>
          <Link href={href()} className="link">
            Volver al inicio
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return <RuletaStage spins={spins} wheel={spins.wheel} />;
}

function RuletaStage({ spins, wheel }: { spins: SpinState; wheel: SpinWheel }) {
  const { card, spin, reload, reloadSpins, href } = useClub();
  const reduce = useReducedMotion();
  const segments = sortedSegments(wheel);
  const rotorRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<SVGSVGElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const attemptKey = useRef<string | null>(null);
  const busy = useRef(false);
  const wheelSpin = useWheelSpin({ count: segments.length, rotorRef, pointerRef });

  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<SpinResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const available = spins.available;
  const winner = phase === "revealed" && result ? result.segmentId : null;

  useEffect(() => {
    if (phase === "revealed") resultRef.current?.focus();
  }, [phase]);

  async function handleSpin() {
    if (busy.current || available < 1) return;
    busy.current = true;
    const key = (attemptKey.current ??= newAttemptKey());
    buzz(8);
    setPhase("spinning");
    setResult(null);
    setMessage(null);
    setStatus("Girando la ruleta…");
    if (!reduce) wheelSpin.start();

    let r: SpinResult;
    try {
      r = await spin(key);
    } catch (error) {
      const conflict = error instanceof ClubApiError && error.status === 409 ? error : null;
      if (!reduce) await wheelSpin.neutral();
      if (conflict) {
        // No hubo tirada: la clave no se reusa y el estado real viene del backend.
        attemptKey.current = null;
        await reloadSpins();
        setMessage(
          conflict.code === "NO_ACTIVE_WHEEL"
            ? "La ruleta no está disponible en este momento."
            : "Ya no te quedan tiradas; quizá las usaste en otra pestaña.",
        );
        setPhase("idle");
      } else {
        setMessage("No pudimos completar la tirada; no se descontó. Intenta de nuevo.");
        setPhase("error");
      }
      setStatus("");
      busy.current = false;
      return;
    }

    attemptKey.current = null;
    const index = segments.findIndex((s) => s.id === r.segmentId);
    // Saldo, Wallet y progreso se refrescan mientras la rueda frena.
    const refreshed = reload();
    if (index < 0) {
      // Versión de ruleta nueva publicada entre medio: sin segmento que señalar.
      await Promise.all([reduce ? null : wheelSpin.neutral(), refreshed]);
    } else if (reduce) {
      await refreshed;
      wheelSpin.snap(index);
    } else {
      await Promise.all([wheelSpin.land(index), refreshed]);
    }
    buzz(r.prize.type === "voucher" ? [18, 70, 28] : 16);
    setResult(r);
    setStatus("");
    setPhase("revealed");
    busy.current = false;
  }

  const spinning = phase === "spinning";
  const canSpin = available > 0 && !spinning;
  const label = spinning ? "Girando…" : phase === "error" ? "Reintentar tirada" : phase === "revealed" ? "Girar otra vez" : "Girar";

  return (
    <div className="view view-ruleta">
      <div className="v-head">
        <h1>Ruleta</h1>
        <p>
          {available > 0
            ? `Tienes ${spinsLabel(available)}. Cada tirada es un premio seguro.`
            : `Cada ${spins.progress.required} compras ganas una tirada.`}
        </p>
      </div>

      <div className="ruleta-stage">
        <div className={`wheel-wrap${reduce && phase === "revealed" ? " rm-swap" : ""}`}>
          <Wheel segments={segments} winnerId={winner} rotorRef={rotorRef} pointerRef={pointerRef} />
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>

        {phase === "revealed" && result ? (
          <Prize result={result} segment={segments.find((s) => s.id === result.segmentId)} balance={card?.balance ?? null} headingRef={resultRef} />
        ) : null}

        {message ? (
          <p className="form-error ruleta-msg" role="alert">
            <CircleAlert aria-hidden="true" />
            {message}
          </p>
        ) : null}

        {available > 0 || spinning || phase === "error" ? (
          <button
            type="button"
            className="btn btn-pop spin-btn"
            onClick={() => void handleSpin()}
            aria-disabled={!canSpin || undefined}
            data-busy={spinning || undefined}
          >
            {phase === "revealed" || phase === "error" ? <RotateCw aria-hidden="true" /> : <WheelIcon aria-hidden="true" />}
            {label}
            {!spinning ? <span className="spin-count">{available}</span> : null}
          </button>
        ) : (
          <div className="tile spin-empty">
            <b>Sin tiradas por ahora</b>
            <SpinProgress current={spins.progress.current} required={spins.progress.required} />
          </div>
        )}
      </div>

      <div className="ruleta-side">
        {available > 0 ? (
          <div className="tile">
            <SpinProgress current={spins.progress.current} required={spins.progress.required} />
          </div>
        ) : null}

        <section className="rc-sec" aria-labelledby="ru-prizes">
          <div className="sec-head">
            <h2 id="ru-prizes">Lo que puede salir</h2>
          </div>
          <ul className="seg-chips">
            {segments.map((s) => (
              <li key={s.id} className={winner === s.id ? "win" : undefined}>
                <span className={`sw ${segmentTone(s.color)}`}>
                  <SegmentGlyph icon={s.icon} />
                </span>
                {s.label}
              </li>
            ))}
          </ul>
          <p className="muted-sm">Los vouchers de la ruleta vencen a los 7 días y se usan en caja con tu tarjeta.</p>
        </section>

        {spins.recent.length ? (
          <section className="rc-sec" aria-labelledby="ru-recent">
            <div className="sec-head">
              <h2 id="ru-recent">Tus últimas tiradas</h2>
            </div>
            <div className="list">
              {spins.recent.slice(0, 5).map((r) => {
                const seg = segments.find((s) => s.id === r.segmentId);
                return (
                  <div className="row" key={r.id}>
                    <span className="ic">
                      <SegmentGlyph icon={seg?.icon} />
                    </span>
                    <span className="tx">
                      <b>{r.label}</b>
                      <small>{shortDate(r.createdAt)}</small>
                    </span>
                    <span className="end dim">{r.prizeType === "points" ? `+${r.pointsAwarded ?? 0} pts` : "Voucher"}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <Link href={href("wallet")} className="link">
          <Wallet aria-hidden="true" />
          Ir a tu Wallet
        </Link>
      </div>
    </div>
  );
}

function Prize({
  result,
  segment,
  balance,
  headingRef,
}: {
  result: SpinResult;
  segment: SpinSegment | undefined;
  balance: number | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const { href } = useClub();
  const voucher = result.voucher;

  if (result.prize.type === "points" || !voucher) {
    return (
      <div className="prize prize-pts">
        <span className={`prize-ic ${segment ? segmentTone(segment.color) : "seg-default"}`}>
          <SegmentGlyph icon={segment?.icon} />
        </span>
        <div>
          <h2 ref={headingRef} tabIndex={-1}>
            <span className="sr-only">Ganaste </span>
            {result.prize.points ? `+${fmtPts(result.prize.points)} pts` : result.prize.label}
          </h2>
          <p>{balance !== null ? `Ya están en tu saldo: ${fmtPts(balance)} pts.` : "Ya están en tu saldo."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prize prize-vch ticket k-ruleta">
      <div className="t-main">
        <span className="t-chip">
          <WheelIcon aria-hidden="true" />
          Premio de la ruleta
        </span>
        <h2 ref={headingRef} tabIndex={-1}>
          <span className="sr-only">Ganaste: </span>
          {voucher.title}
        </h2>
        <p className="t-val">{voucher.kind === "product" ? "Producto gratis" : `Descuento de ${voucher.valueLabel}`}</p>
        <p className="t-exp">
          <Clock3 aria-hidden="true" />
          <span>{expiryLabel(voucher.expiresAt)}</span>
        </p>
        <Link href={href("wallet")} className="btn btn-soft btn-sm prize-cta">
          <Wallet aria-hidden="true" />
          Ver en tu Wallet
        </Link>
      </div>
    </div>
  );
}
