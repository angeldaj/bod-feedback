"use client";

import { createElement, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { animate, motion, stagger, useReducedMotion } from "motion/react";
import { CalendarDays, ChevronRight, CircleAlert, Clock3, Gift, Lock, Radio, RotateCw, Sparkles, Store, Ticket, Wallet, Wheat } from "lucide-react";
import { ClubApiError, DEMO_TICKET_HINTS, type TicketActivation, type TicketPromo, type Voucher } from "@/lib/club-api";
import { useClub } from "../club-provider";
import { WheelIcon, categoryIcon, expiryLabel, voucherKindClass } from "../club-visuals";
import { Skeleton } from "../pieces";

const CODE_LENGTH = 5;
// Alfabeto de los códigos impresos: sin 0, 1, A, I ni O para que no se confundan.
const NOT_IN_CODES = /[^2-9B-HJ-NP-Z]/g;
const DAY = 86_400_000;

const daysLeft = (endsAt: string, now = Date.now()) => Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / DAY));
const daysLabel = (n: number) => (n === 1 ? "Queda 1 día" : `Quedan ${n} días`);
const ticketsLabel = (n: number) => (n === 1 ? "1 ticket" : `${n} tickets`);
const isOver = (promo: TicketPromo) => Date.now() > new Date(promo.endsAt).getTime();
const longDate = (iso: string) => new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "long" });

function Stamps({ current, required, fresh = false }: { current: number; required: number; fresh?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="rasp-stamps" role="img" aria-label={`${current} de ${required} tickets`} style={{ gridTemplateColumns: `repeat(${required}, 1fr)` }}>
      {Array.from({ length: required }, (_, i) => {
        const on = i < current;
        // El sello recién ganado cae en su lugar.
        const pop = fresh && !reduce && i === current - 1;
        return (
          <motion.span
            key={`${i}-${on}`}
            className={`rasp-stamp${on ? " on" : ""}`}
            initial={pop ? { scale: 1.35, rotate: -12, opacity: 0 } : false}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.45, duration: 0.55, delay: pop ? 0.5 : 0 }}
          >
            <Wheat aria-hidden="true" />
          </motion.span>
        );
      })}
    </div>
  );
}

/** Número que baja delante del socio cuando sale un premio. */
function Rolling({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  // El texto lo escribe la animación; React solo pinta el valor inicial.
  const [initial] = useState(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || shown.current === value) return;
    const from = shown.current;
    shown.current = value;
    el.parentElement?.classList.add("flash");
    const controls = animate(from, value, {
      duration: reduce ? 0 : 0.9,
      delay: reduce ? 0 : 0.3,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (x) => (el.textContent = String(Math.round(x))),
      onComplete: () => window.setTimeout(() => el.parentElement?.classList.remove("flash"), 900),
    });
    return () => controls.stop();
  }, [reduce, value]);
  return <span ref={ref}>{initial}</span>;
}

/** Tarjeta de Inicio. Sin raspadito (o ya terminado) no se muestra. */
export function RaspaditoTile() {
  const { ticketPromo, href } = useClub();
  if (!ticketPromo || isOver(ticketPromo)) return null;
  const { current, required } = ticketPromo.collection;
  const missing = required - current;
  return (
    <div className="tile rasp-tile">
      <div className="rasp-tile-top">
        <h3>
          Raspadito <em>de Navidad</em>
        </h3>
        <span className="rasp-chip">
          <CalendarDays aria-hidden="true" />
          {daysLabel(daysLeft(ticketPromo.endsAt))}
        </span>
      </div>
      <p>¿Te salió un ticket con tu pan de jamón? Actívalo y te guardamos el premio.</p>
      <Stamps current={current} required={required} />
      <div className="rasp-tile-foot">
        <small>
          {current === 0 ? `Cada ${required} tickets, un pan de jamón de regalo.` : `Te ${missing === 1 ? "falta 1 ticket" : `faltan ${missing} tickets`} para tu pan de jamón.`}
        </small>
        <Link href={href("raspadito")} className="btn btn-sm rasp-cta">
          <Ticket aria-hidden="true" />
          Activar ticket
        </Link>
      </div>
    </div>
  );
}

export function RaspaditoScreen() {
  const { ticketPromo, ticketPromoLoaded, href } = useClub();
  if (!ticketPromo) {
    if (!ticketPromoLoaded) {
      return (
        <div className="view view-rasp" aria-busy="true">
          <Skeleton height={72} />
          <Skeleton height={320} />
        </div>
      );
    }
    return (
      <div className="view">
        <div className="v-head">
          <h1>Raspadito de Navidad</h1>
        </div>
        <div className="empty">
          <Ticket aria-hidden="true" />
          <b>El raspadito no está disponible en este momento.</b>
          <span>Guarda tu ticket: si trae premio, también puedes cobrarlo en caja.</span>
          <Link href={href()} className="link">
            Volver al inicio
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }
  return <RaspaditoStage promo={ticketPromo} />;
}

function RaspaditoStage({ promo }: { promo: TicketPromo }) {
  const [activation, setActivation] = useState<TicketActivation | null>(null);
  const [revealed, setRevealed] = useState(false);
  // Mientras el ticket está tapado se muestran la colección y las existencias de antes: el raspado no se adelanta.
  const [held, setHeld] = useState<TicketPromo | null>(null);
  const shown = held ?? promo;
  const over = isOver(promo);

  return (
    <div className="view view-rasp">
      <div className="v-head">
        <h1>
          Raspadito <em>de Navidad</em>
        </h1>
        <p>{over ? "La promoción terminó el 6 de enero. Gracias por participar." : "Activa el código que raspaste en tu ticket del pan de jamón."}</p>
      </div>

      <div className="rasp-main">
        {activation ? (
          <>
            <ScratchCard
              activation={activation}
              onReveal={() => {
                setRevealed(true);
                setHeld(null);
              }}
            />
            {revealed ? (
              <TicketResult
                activation={activation}
                onAnother={() => {
                  setActivation(null);
                  setRevealed(false);
                }}
              />
            ) : null}
          </>
        ) : over ? null : (
          <CodeForm
            promo={promo}
            onActivated={(a, before) => {
              setHeld(before);
              setRevealed(false);
              setActivation(a);
            }}
          />
        )}
      </div>

      <PromoSide promo={shown} fresh={revealed} />
    </div>
  );
}

function CodeForm({ promo, onActivated }: { promo: TicketPromo; onActivated: (a: TicketActivation, before: TicketPromo) => void }) {
  const { activateTicket, demo } = useClub();
  const reduce = useReducedMotion();
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; attempts: boolean } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lockedUntil = promo.lockedUntil ? new Date(promo.lockedUntil).getTime() : 0;
  const locked = lockedUntil > now;
  useEffect(() => {
    if (!lockedUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  function shake() {
    if (!boxRef.current || reduce) return;
    animate(boxRef.current, { x: [0, -8, 7, -4, 0] }, { duration: 0.36, ease: "easeOut" });
  }

  function onChange(raw: string) {
    const upper = raw.toUpperCase();
    const clean = upper.replace(NOT_IN_CODES, "").slice(0, CODE_LENGTH);
    setHint(/[01AIO]/.test(upper) ? "Ese carácter no aparece en los códigos. Si ves una O, prueba con Q o D." : null);
    setError(null);
    setCode(clean);
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy || locked) return;
    if (code.length < CODE_LENGTH) {
      const n = CODE_LENGTH - code.length;
      setError({ text: `Faltan ${n} ${n === 1 ? "carácter" : "caracteres"}. El código tiene ${CODE_LENGTH}.`, attempts: false });
      shake();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await activateTicket(code);
      setCode("");
      onActivated(result, promo);
    } catch (err) {
      const text = err instanceof Error && err.message ? err.message : "No pudimos activar el ticket. Intenta de nuevo.";
      setError({ text, attempts: err instanceof ClubApiError && err.code === "TICKET_NOT_FOUND" });
      setNow(Date.now());
      shake();
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    const s = Math.max(0, Math.round((lockedUntil - now) / 1000));
    return (
      <div className="tile rasp-lock" role="status">
        <span className="rasp-label">
          <Lock aria-hidden="true" />
          Activación en pausa
        </span>
        <span className="rasp-clock tab-nums">
          {String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}
        </span>
        <p>Probaste varios códigos que no existen. Espera y revisa el ticket con buena luz; si el código no se lee, llévalo a caja.</p>
      </div>
    );
  }

  const cursor = Math.min(code.length, CODE_LENGTH - 1);
  return (
    <form className="tile rasp-form" onSubmit={(e) => void submit(e)} noValidate>
      <div className="rasp-where">
        <span className="rasp-mini" aria-hidden="true">
          <i />
          <i />
          <i />
          <b>CÓDIGO</b>
        </span>
        <p>Está debajo de la capa raspable de tu ticket. Son {CODE_LENGTH} letras y números; no usamos O, I, 0 ni 1.</p>
      </div>
      <label htmlFor="rasp-code" className="rasp-field-label">
        Código BodegaClub
      </label>
      <div ref={boxRef} className={`rasp-code${focused ? " focus" : ""}${error ? " err" : ""}`}>
        <input
          ref={inputRef}
          id="rasp-code"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={CODE_LENGTH + 2}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby="rasp-code-msg"
        />
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <span key={i} className={`rasp-cell${i === cursor && code.length < CODE_LENGTH ? " cur" : ""}`} aria-hidden="true">
            {code[i] ?? ""}
          </span>
        ))}
      </div>
      <div id="rasp-code-msg" aria-live="polite">
        {error ? (
          <p className="form-error">
            <CircleAlert aria-hidden="true" />
            <span>
              {error.text}
              {error.attempts ? ` Te ${promo.attemptsLeft === 1 ? "queda 1 intento" : `quedan ${promo.attemptsLeft} intentos`} antes de una pausa de 15 minutos.` : ""}
            </span>
          </p>
        ) : hint ? (
          <p className="muted-sm rasp-hint">{hint}</p>
        ) : null}
      </div>
      <button type="submit" className="btn btn-pop rasp-submit" aria-disabled={busy || undefined} data-busy={busy || undefined}>
        {busy ? <span className="rasp-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
        {busy ? "Validando" : "Activar"}
      </button>
      <p className="muted-sm rasp-center">Puedes activar tickets hasta el {longDate(promo.endsAt)}.</p>
      {demo ? (
        <div className="rasp-demo">
          <span className="muted-sm">Códigos de prueba de la demo</span>
          <div className="rasp-demo-list">
            {DEMO_TICKET_HINTS.map((h) => (
              <button key={h.code} type="button" className="pill" onClick={() => onChange(h.code)}>
                <b>{h.code}</b>
                {h.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}

function ScratchCard({ activation, onReveal }: { activation: TicketActivation; onReveal: () => void }) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const s = useRef({ drawing: false, last: null as { x: number; y: number } | null, moves: 0, flakeAt: 0, done: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    const paint = () => alive && !s.current.done && paintFoil(canvas);
    paint();
    // Repinta con las fuentes de la casa cuando terminen de cargar.
    void document.fonts?.ready.then(paint);
    return () => {
      alive = false;
    };
  }, []);

  function reveal() {
    if (s.current.done) return;
    s.current.done = true;
    s.current.drawing = false;
    setDone(true);
    const canvas = canvasRef.current;
    if (canvas) animate(canvas, { opacity: 0 }, { duration: reduce ? 0 : 0.32, ease: [0.23, 1, 0.32, 1] }).then(() => (canvas.style.visibility = "hidden"));
    const parts = prizeRef.current ? Array.from(prizeRef.current.children) : [];
    if (parts.length && !reduce) {
      animate(parts, { opacity: [0, 1], scale: [0.94, 1] }, { type: "spring", bounce: 0.35, duration: 0.6, delay: stagger(0.06) });
    }
    window.setTimeout(onReveal, reduce ? 0 : 420);
  }

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function scratchTo(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const st = s.current;
    if (!canvas || !ctx || !st.last) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(st.last.x, st.last.y);
    ctx.lineTo(p.x + 0.1, p.y);
    ctx.stroke();
    st.last = p;
    if (!reduce && performance.now() - st.flakeAt > 28) {
      st.flakeAt = performance.now();
      flake(e.clientX, e.clientY);
    }
    st.moves += 1;
    if (st.moves % 6 === 0 && clearedShare(canvas, ctx) > 0.52) reveal();
  }

  const { outcome, prize, voucher, claimed } = activation;
  const PrizeIcon = outcome === "none" ? WheelIcon : categoryIcon(prize?.category);
  return (
    <div className="rasp-scratch">
      <div className="rasp-scratch-row">
        <span className="rasp-label">
          Ticket {activation.code} · lote {activation.lot}
        </span>
        {!done ? (
          <button type="button" className="link" onClick={reveal}>
            Descubrir todo
          </button>
        ) : null}
      </div>
      <div className="rasp-card">
        <div className="rasp-prize" ref={prizeRef}>
          {outcome === "claimed" ? <span className="rasp-stampmark">Retirado en caja</span> : null}
          <span className={`rasp-prize-ic${outcome === "none" ? " none" : ""}`}>
            {createElement(PrizeIcon, { "aria-hidden": true })}
          </span>
          <span className="rasp-kick">{outcome === "none" ? "Sin premio esta vez" : outcome === "claimed" ? "Tu ticket tenía" : "Ganaste"}</span>
          {outcome === "none" ? (
            <span className="rasp-name">Una tirada</span>
          ) : outcome === "cash" ? (
            <span className="rasp-name money tab-nums">{prize?.label}</span>
          ) : (
            <span className="rasp-name">{prize?.label}</span>
          )}
          <span className="rasp-sub">
            {outcome === "none"
              ? "en la ruleta del club, y entras al sorteo del 6 de enero."
              : outcome === "cash"
                ? "en efectivo. Se cobra en caja con tu cédula."
                : outcome === "claimed"
                  ? `Se entregó el ${claimed ? longDate(claimed.date) : ""}${claimed ? ` en ${claimed.branch}` : ""}.`
                  : voucher
                    ? "Retíralo en cualquier sede."
                    : ""}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          className="rasp-foil"
          role="img"
          aria-label="Capa para raspar. Usa Descubrir todo si prefieres no raspar."
          onPointerDown={(e) => {
            if (s.current.done) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            s.current.drawing = true;
            s.current.last = point(e);
            scratchTo(e);
          }}
          onPointerMove={(e) => s.current.drawing && scratchTo(e)}
          onPointerUp={() => (s.current.drawing = false)}
          onPointerCancel={() => (s.current.drawing = false)}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {done ? (outcome === "none" ? "Sin premio: sumaste una tirada de ruleta." : `Resultado: ${prize?.label ?? ""}.`) : ""}
      </p>
      {!done ? <p className="muted-sm rasp-center">Raspa con el dedo para confirmar tu premio.</p> : null}
    </div>
  );
}

function paintFoil(canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const family = getComputedStyle(canvas).fontFamily;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  const g = ctx.createLinearGradient(0, 0, r.width, r.height);
  g.addColorStop(0, "#bdb2a0");
  g.addColorStop(0.35, "#efe8dc");
  g.addColorStop(0.55, "#cfc4b2");
  g.addColorStop(0.8, "#f3ede3");
  g.addColorStop(1, "#b5a994");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r.width, r.height);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,.35)" : "rgba(90,70,40,.12)";
    ctx.fillRect(Math.random() * r.width, Math.random() * r.height, 1.2, 1.2);
  }
  // Motivo repetido, como la tinta de seguridad del ticket impreso.
  ctx.save();
  ctx.translate(r.width / 2, r.height / 2);
  ctx.rotate(-0.32);
  ctx.font = `600 15px ${family}`;
  ctx.fillStyle = "rgba(110, 88, 56, 0.16)";
  for (let y = -r.height; y < r.height; y += 30) {
    for (let x = -r.width; x < r.width; x += 116) ctx.fillText("LA BODEGA ✦", x + (Math.round(y / 30) % 2 ? 58 : 0), y);
  }
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillStyle = "#5b4630";
  ctx.font = `700 34px ${family}`;
  ctx.fillText("RASPA AQUÍ", r.width / 2, r.height / 2 + 4);
  ctx.font = `600 17px ${family}`;
  ctx.fillText("TU PREMIO DE NAVIDAD", r.width / 2, r.height / 2 + 30);
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 46;
}

function clearedShare(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let clear = 0;
  let n = 0;
  for (let i = 3; i < d.length; i += 4 * 24) {
    n += 1;
    if (d[i] < 40) clear += 1;
  }
  return n ? clear / n : 0;
}

// Virutas de la capa que caen al raspar: el raspado se siente físico.
function flake(x: number, y: number) {
  const f = document.createElement("span");
  f.className = "rasp-flake";
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  f.style.background = Math.random() > 0.5 ? "#d7cdbd" : "#efe8dc";
  document.body.appendChild(f);
  animate(
    f,
    { x: (Math.random() - 0.5) * 50, y: 30 + Math.random() * 50, rotate: Math.random() * 360, opacity: [1, 0] },
    { duration: 0.7, ease: [0.4, 0, 0.9, 0.6] },
  ).then(() => f.remove());
}

function VoucherTicket({ voucher, chip, sub, innerRef }: { voucher: Voucher; chip: string; sub: string; innerRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={innerRef} className={`prize prize-vch ticket ${voucherKindClass(voucher)}`}>
      <div className="t-main">
        <span className="t-chip">
          <Gift aria-hidden="true" />
          {chip}
        </span>
        <h2>{voucher.title}</h2>
        <p className="t-val">{sub}</p>
        <p className="t-exp">
          <Clock3 aria-hidden="true" />
          <span>{expiryLabel(voucher.expiresAt)}</span>
        </p>
      </div>
    </div>
  );
}

function TicketResult({ activation, onAnother }: { activation: TicketActivation; onAnother: () => void }) {
  const { flyToWallet, notify, reload, href } = useClub();
  const voucherRef = useRef<HTMLDivElement>(null);
  const giftRef = useRef<HTMLDivElement>(null);
  const ran = useRef(false);
  const { outcome, voucher, collectionVoucher, promo } = activation;

  // Una sola vez por ticket (StrictMode monta dos veces en desarrollo).
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const timers: number[] = [];
    if (voucher) {
      timers.push(
        window.setTimeout(() => {
          notify(Ticket, "Guardado en tu Wallet", outcome === "cash" ? `${voucher.title}. Cóbralo en caja con tu cédula.` : `${voucher.title}. Retíralo en cualquier sede.`);
          flyToWallet(voucher, voucherRef.current, () => void reload());
        }, 900),
      );
    } else {
      void reload();
      if (activation.spinAwarded) notify(Sparkles, "Sumaste 1 tirada", "Ya puedes girar la ruleta del club.");
    }
    if (collectionVoucher) {
      timers.push(
        window.setTimeout(() => {
          notify(Gift, "Colección completa", `Te regalamos un pan de jamón por ${promo.collection.required} tickets.`);
          flyToWallet(collectionVoucher, giftRef.current, () => void reload());
        }, voucher ? 2600 : 1400),
      );
    }
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- celebración única al descubrir el ticket
  }, []);

  return (
    <motion.div className="rasp-result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
      {voucher ? (
        <VoucherTicket
          innerRef={voucherRef}
          voucher={voucher}
          chip="Raspadito de Navidad"
          sub={outcome === "cash" ? "Cóbralo en caja con tu cédula" : "Producto gratis en cualquier sede"}
        />
      ) : null}
      {outcome === "none" ? (
        <div className="tile rasp-note">
          <WheelIcon aria-hidden="true" />
          <p>
            Sumaste <b>1 tirada</b> de ruleta y este ticket es tu participación <b>{promo.drawEntries}</b> en el sorteo del 6 de enero.
          </p>
        </div>
      ) : null}
      {outcome === "claimed" ? (
        <div className="tile rasp-note">
          <Store aria-hidden="true" />
          <p>Este premio ya se entregó en caja, así que no se entrega otra vez. El ticket igual suma a tu colección.</p>
        </div>
      ) : null}
      {collectionVoucher ? (
        <div className="tile rasp-complete">
          <span className="rasp-label">Colección completa</span>
          <h3>
            Cinco tickets, <em>un pan de jamón</em>
          </h3>
          <Stamps current={promo.collection.required} required={promo.collection.required} />
          <VoucherTicket innerRef={giftRef} voucher={collectionVoucher} chip="Regalo de colección" sub="Producto gratis en cualquier sede" />
        </div>
      ) : null}
      <div className="rasp-actions">
        {outcome === "none" ? (
          <Link href={href("ruleta")} className="btn btn-soft">
            <WheelIcon aria-hidden="true" />
            Ir a la ruleta
          </Link>
        ) : (
          <Link href={href("wallet")} className="btn btn-soft">
            <Wallet aria-hidden="true" />
            Ver Wallet
          </Link>
        )}
        <button type="button" className="btn btn-pop" onClick={onAnother}>
          <RotateCw aria-hidden="true" />
          Otro ticket
        </button>
      </div>
    </motion.div>
  );
}

function PromoSide({ promo, fresh }: { promo: TicketPromo; fresh: boolean }) {
  const { current, required } = promo.collection;
  const missing = required - current;
  const [big, ...rest] = promo.stock;
  return (
    <div className="rasp-side">
      <section className="tile" aria-labelledby="rasp-coll">
        <div className="rasp-head">
          <h2 id="rasp-coll">Tu colección</h2>
          <span className="rasp-label tab-nums">
            {current} de {required}
          </span>
        </div>
        <Stamps current={current} required={required} fresh={fresh} />
        <p className="muted-sm">
          {current === 0 ? `Cada ${required} tickets activados, un pan de jamón de regalo.` : `Te ${missing === 1 ? "falta 1 ticket" : `faltan ${missing} tickets`} para tu pan de jamón de regalo.`}
        </p>
      </section>

      {big ? (
        <section className="tile" aria-labelledby="rasp-left">
          <div className="rasp-head">
            <h2 id="rasp-left">Premios que quedan</h2>
          </div>
          <div className="rasp-left-hero">
            <span className="tab-nums">
              <Rolling value={big.left} />
            </span>
            <p>
              <b>Premios de {big.label}</b>
              quedan de {big.total}, uno por lote
            </p>
          </div>
          <div className="rasp-left-grid">
            {rest.map((s) => (
              <div key={s.key} className={`rasp-left-row${s.left ? "" : " out"}`}>
                <span>{s.label}</span>
                <b className="tab-nums">
                  <Rolling value={s.left} /> <small>de {s.total}</small>
                </b>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="tile rasp-draw">
        <span className="rasp-draw-ic">
          <Radio aria-hidden="true" />
        </span>
        <div>
          <b>Sorteo del {longDate(promo.drawAt)}</b>
          <span>
            {promo.drawEntries
              ? `Participas con ${ticketsLabel(promo.drawEntries)} sin premio. En vivo por Instagram.`
              : "Cada ticket sin premio que actives es una participación. En vivo por Instagram."}
          </span>
        </div>
      </section>
    </div>
  );
}
