"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog } from "@base-ui/react/dialog";
import QRCode from "react-qr-code";
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  Clock3,
  Coins,
  Gift,
  Info,
  Layers,
  Lock,
  LockOpen,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import type { ClubTier, Voucher } from "@/lib/club-api";
import { useClub, type Flight } from "./club-provider";
import { MembershipCard } from "./membership-card";
import {
  ORIGIN_LABEL,
  SKIN_NAME,
  expiryLabel,
  toFace,
  voucherKindClass,
} from "./club-visuals";

const EASE = [0.22, 1, 0.36, 1] as const;

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Modal({
  open,
  onClose,
  className,
  children,
  initialFocus,
  backdrop = false,
  label,
  onKeyDown,
}: {
  open: boolean;
  onClose: () => void;
  className: string;
  children: React.ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null>;
  backdrop?: boolean;
  label: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}) {
  const { themeClass } = useClub();
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        {backdrop ? <Dialog.Backdrop className={`${themeClass} mc2-backdrop`} /> : null}
        <Dialog.Popup className={`${themeClass} ${className}`} initialFocus={initialFocus} aria-label={label} onKeyDown={onKeyDown}>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ---------------- voucher ---------------- */

function VoucherSheet({ voucher, onClose }: { voucher: Voucher; onClose: () => void }) {
  const now = useNow();
  const closeRef = useRef<HTMLButtonElement>(null);
  const isDiscount = voucher.kind !== "product";
  return (
    <Modal open onClose={onClose} className="mc2-sheet" backdrop initialFocus={closeRef} label={voucher.title}>
      <span className="grab" aria-hidden="true" />
      <div className={`ticket ${voucherKindClass(voucher)}`}>
        <div className="t-main">
          <span className="t-chip">
            {voucher.origin === "redemption" ? <Coins aria-hidden="true" /> : <Gift aria-hidden="true" />}
            {ORIGIN_LABEL(voucher)}
          </span>
          <Dialog.Title render={<h2 />}>{voucher.title}</Dialog.Title>
          <p className="t-val">
            {isDiscount ? "Descuento" : "Producto gratis"}
            {voucher.note ? `. ${voucher.note}` : ""}
          </p>
          <p className="t-exp">
            <Clock3 aria-hidden="true" />
            <span>{expiryLabel(voucher.expiresAt, now)}</span>
          </p>
        </div>
        <div className="t-perf" aria-hidden="true" />
        <div className="t-stub">
          <div className="qr">
            <QRCode value={voucher.qrValue} size={256} viewBox="0 0 256 256" fgColor="#1e140d" bgColor="#ffffff" level="M" aria-hidden="true" style={{ width: "100%", height: "100%" }} />
          </div>
          <div>
            <small>Código</small>
            <strong>{voucher.code}</strong>
            <span>Válido solo con tu tarjeta de socio. La caja también lo ve al escanear tu QR.</span>
          </div>
        </div>
      </div>
      <p className="rule-note">
        <Info aria-hidden="true" />
        <span>
          {isDiscount
            ? "Es tu descuento de esta visita: solo se usa uno por visita."
            : "Se suma a cualquier descuento en la misma visita."}
        </span>
      </p>
      <Dialog.Close ref={closeRef} className="btn btn-ghost btn-block">
        Cerrar
      </Dialog.Close>
    </Modal>
  );
}

/* ---------------- modo caja ---------------- */

function CajaMode({ onClose }: { onClose: () => void }) {
  const { card, activeVouchers } = useClub();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    return () => {
      lock?.release().catch(() => undefined);
    };
  }, []);

  if (!card) return null;
  return (
    <Modal open onClose={onClose} className="mc2-full caja" initialFocus={closeRef} label="Modo caja">
      <Dialog.Close ref={closeRef} className="icon-btn x" aria-label="Cerrar modo caja">
        <X aria-hidden="true" />
      </Dialog.Close>
      <span className={`skin-${card.tier.skin}`}>
        <span className="tier-pill">
          <Sparkles aria-hidden="true" />
          {card.tier.name}
        </span>
      </span>
      <Dialog.Title render={<h2 />}>Muestra esta pantalla en caja</Dialog.Title>
      <div className="qrbox">
        <QRCode value={card.qrValue} size={256} viewBox="0 0 256 256" fgColor="#1e140d" bgColor="#ffffff" level="M" aria-label="Código QR de tu tarjeta" style={{ width: "100%", height: "100%" }} />
      </div>
      <div className="num">{card.memberNo}</div>
      <span className="vs">
        <Ticket aria-hidden="true" />
        {activeVouchers.length} {activeVouchers.length === 1 ? "voucher activo" : "vouchers activos"}
      </span>
      <p>La caja ve tus vouchers al escanear. Sube el brillo si el lector no lo toma.</p>
    </Modal>
  );
}

/* ---------------- galería de diseños ---------------- */

const CATEGORY_LABEL = { free: "Libre", earned: "Se gana", season: "Temporada" } as const;

function CardGallery({ onClose }: { onClose: () => void }) {
  const { card, designs, selectDesign } = useClub();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(() => Math.max(0, designs.findIndex((d) => d.id === card?.designId)));
  const stageRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const panned = useRef(false);
  const [saving, setSaving] = useState(false);

  const step = (dir: 1 | -1) => setActive((i) => Math.max(0, Math.min(designs.length - 1, i + dir)));

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let acc = 0;
    let coolUntil = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Date.now() < coolUntil) return;
      acc += e.deltaY;
      if (Math.abs(acc) > 40) {
        setActive((i) => Math.max(0, Math.min(designs.length - 1, i + (acc > 0 ? 1 : -1))));
        acc = 0;
        coolUntil = Date.now() + 320;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [designs.length]);

  if (!card || !designs.length) return null;
  const design = designs[active];
  const current = design.id === card.designId;

  function handlePanEnd(_: PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.y) > 36) {
      panned.current = true;
      step(info.offset.y < 0 ? 1 : -1);
      window.setTimeout(() => (panned.current = false), 0);
    }
  }

  async function handleUse() {
    if (!design.unlocked || current) return;
    setSaving(true);
    const ok = await selectDesign(design.id);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      className="mc2-full gallery"
      initialFocus={nextRef}
      label="Diseño de tarjeta"
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault();
          step(1);
        }
        if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault();
          step(-1);
        }
      }}
    >
      <div className="g-top">
        <Dialog.Close className="icon-btn" aria-label="Cerrar galería">
          <X aria-hidden="true" />
        </Dialog.Close>
        <Dialog.Title render={<h2 />}>Diseño de tarjeta</Dialog.Title>
        <span style={{ width: 44 }} aria-hidden="true" />
      </div>

      <div className="g-label" aria-live="polite">
        <small>{CATEGORY_LABEL[design.category]}</small>
        <strong>{design.name}</strong>
      </div>

      <motion.div ref={stageRef} className="g-stage" onPanEnd={handlePanEnd}>
        <div className="g-shadow" aria-hidden="true" />
        {designs.map((d, i) => {
          const offset = i - active;
          const passed = offset < 0;
          return (
            <motion.div
              key={d.id}
              className="g-item"
              aria-hidden={offset !== 0}
              initial={false}
              animate={
                passed
                  ? { x: "-50%", y: "-150%", z: 90, rotateX: 16, scale: 1.04, opacity: 0 }
                  : { x: "-50%", y: `${-offset * 13}%`, z: -offset * 72, rotateX: 0, scale: 1 - offset * 0.045, opacity: offset > 6 ? 0 : 1 }
              }
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 30, mass: 0.9 }}
              style={{ zIndex: passed ? 60 : 50 - offset, filter: offset > 0 ? `brightness(${1 - offset * 0.07})` : "none" }}
              onClick={() => {
                if (!panned.current && offset > 0) setActive(i);
              }}
            >
              <MembershipCard data={toFace(card, { designId: d.id })} showBack={false} locked={!d.unlocked} />
            </motion.div>
          );
        })}
        <div className="g-dots" role="group" aria-label="Diseños">
          {designs.map((d, i) => (
            <button key={d.id} type="button" aria-label={d.name} aria-current={i === active} onClick={() => setActive(i)} />
          ))}
        </div>
      </motion.div>

      <div className="g-foot">
        <p className="g-desc">{design.description}</p>
        <span className={`pill g-status${design.unlocked ? "" : " coral"}`}>
          {design.unlocked ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />}
          {design.unlockLabel}
        </span>
        <div className="g-nav">
          <button ref={nextRef} type="button" className="icon-btn" aria-label="Diseño siguiente" onClick={() => step(1)} disabled={active === designs.length - 1}>
            <ChevronUp aria-hidden="true" />
          </button>
          <button ref={primaryRef} type="button" className="btn btn-pop" onClick={handleUse} disabled={!design.unlocked || current || saving}>
            {current ? "Es tu diseño actual" : design.unlocked ? (saving ? "Guardando" : "Usar este diseño") : "Aún no lo ganas"}
          </button>
          <button type="button" className="icon-btn" aria-label="Diseño anterior" onClick={() => step(-1)} disabled={active === 0}>
            <ChevronDown aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- subida de nivel ---------------- */

function LevelUp({ from, to, onClose }: { from: ClubTier; to: ClubTier; onClose: () => void }) {
  const { card, designs } = useClub();
  const reduce = useReducedMotion();
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<"from" | "to">(reduce ? "to" : "from");
  const [revealed, setRevealed] = useState(Boolean(reduce));
  const okRef = useRef<HTMLButtonElement>(null);

  // El popup vive en un portal que monta un instante después: se anima al recibir el nodo.
  useEffect(() => {
    if (reduce || !cardEl) return;
    let cancelled = false;
    (async () => {
      await animate(cardEl, { rotateY: [0, 90], scale: [0.92, 0.96] }, { duration: 0.42, delay: 0.35, ease: [0.55, 0, 0.8, 0.3] });
      if (cancelled) return;
      setPhase("to");
      await animate(cardEl, { rotateY: [-90, 0], scale: [0.96, 1] }, { duration: 0.62, ease: EASE });
      if (!cancelled) setRevealed(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [cardEl, reduce]);

  if (!card) return null;
  const tier = phase === "to" ? to : from;
  const unlocked = designs.find((d) => d.category === "earned" && d.unlocked && d.unlockLabel.includes(to.name));

  return (
    <Modal open onClose={onClose} className="mc2-full lu" initialFocus={okRef} label={`Subiste a ${to.name}`}>
      <div className="lu-card">
        <div ref={setCardEl} style={{ position: "relative" }}>
          <MembershipCard data={toFace(card, { skin: tier.skin, tierName: tier.name })} showBack={false} />
          <div className={`lu-sweep${revealed ? " go" : ""}`} aria-hidden="true" />
        </div>
      </div>
      <motion.div className="lu-t" initial={false} animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 }} transition={{ duration: 0.45, ease: EASE }}>
        <small>Nuevo nivel</small>
        <Dialog.Title render={<h2 />}>Subiste a {to.name}</Dialog.Title>
      </motion.div>
      <motion.div className="lu-t lu-list" initial={false} animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 }} transition={{ duration: 0.45, delay: 0.12, ease: EASE }}>
        <span className="pill">
          <Sparkles aria-hidden="true" />
          Piel {SKIN_NAME[to.skin]} en tu tarjeta
        </span>
        {unlocked ? (
          <span className="pill">
            <Layers aria-hidden="true" />
            Ganaste el diseño {unlocked.name}
          </span>
        ) : null}
        {to.perk ? (
          <span className="pill">
            <Gift aria-hidden="true" />
            {to.perk}, en tu Wallet
          </span>
        ) : null}
      </motion.div>
      <motion.div className="lu-t" initial={false} animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 12 }} transition={{ duration: 0.45, delay: 0.24, ease: EASE }}>
        <Dialog.Close ref={okRef} className="btn btn-pop">
          Ver mi tarjeta
        </Dialog.Close>
      </motion.div>
    </Modal>
  );
}

/* ---------------- aviso + vuelo a la Wallet ---------------- */

function NoticeToast() {
  const { notice, themeClass } = useClub();
  return (
    <div aria-live="polite" role="status">
      <AnimatePresence>
        {notice ? (
          <motion.div
            key={notice.id}
            className={`${themeClass} mc2-notif`}
            initial={{ y: -90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <span className="ic">
              <notice.icon aria-hidden="true" />
            </span>
            <span>
              <b>{notice.title}</b>
              <small>{notice.sub}</small>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GhostTicket({ flight }: { flight: Flight }) {
  const { themeClass } = useClub();
  const { from, to, voucher } = flight;
  const w = Math.min(240, Math.max(160, from.width * 0.7));
  const h = 44;
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  return (
    <motion.div
      className={`${themeClass} ghost-ticket ${voucherKindClass(voucher)}`}
      style={{ left: from.left + from.width / 2 - w / 2, top: from.top + from.height / 2 - h / 2, width: w, height: h }}
      initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
      animate={{ x: [0, dx * 0.45, dx], y: [0, dy * 0.3 - 60, dy], scale: [1, 0.9, 0.18], rotate: [0, -6, 0], opacity: [1, 1, 0.6] }}
      transition={{ duration: 0.82, ease: [0.5, 0, 0.3, 1], times: [0, 0.45, 1] }}
      onAnimationComplete={flight.onDone}
      aria-hidden="true"
    >
      <Ticket size={16} />
      {voucher.title}
    </motion.div>
  );
}

function FlightLayer() {
  const { flights } = useClub();
  // Los vuelos solo existen tras una interacción, así que nunca se renderizan en el servidor.
  if (!flights.length) return null;
  return createPortal(
    <>
      {flights.map((f) => (
        <GhostTicket key={f.id} flight={f} />
      ))}
    </>,
    document.body,
  );
}

export function ClubOverlays() {
  const { overlay, closeOverlay, vouchers } = useClub();
  const voucher = overlay?.type === "voucher" ? vouchers.find((v) => v.id === overlay.id) : undefined;
  return (
    <>
      {voucher ? <VoucherSheet voucher={voucher} onClose={closeOverlay} /> : null}
      {overlay?.type === "caja" ? <CajaMode onClose={closeOverlay} /> : null}
      {overlay?.type === "gallery" ? <CardGallery onClose={closeOverlay} /> : null}
      {overlay?.type === "levelup" ? <LevelUp from={overlay.from} to={overlay.to} onClose={closeOverlay} /> : null}
      <NoticeToast />
      <FlightLayer />
    </>
  );
}

