"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion, stagger, useReducedMotion } from "motion/react";
import { CalendarDays, ChevronRight, CircleAlert, Clock3, Gift, Lock, Radio, RotateCw, Sparkles, Store, Ticket, Wallet } from "lucide-react";
import { ClubApiError, DEMO_TICKET_HINTS, type SpinSegment, type TicketActivation, type TicketPromo, type TicketSecondChance, type Voucher } from "@/lib/club-api";
import { useClub } from "../club-provider";
import { Wheel, useWheelSpin } from "../wheel";
import { WheelIcon, expiryLabel, voucherKindClass } from "../club-visuals";
import { Art, categoryArt } from "../illustrations";
import { Skeleton } from "../pieces";
import { playConfetti } from "../sounds";

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
            <Art kind="pan" />
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
      <Snow />
      <Art kind="pan" className="rasp-tile-art" />
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
              label={`Ticket ${activation.code} · lote ${activation.lot}`}
              result={activation.outcome === "none" ? "Sin premio: tienes una segunda oportunidad en la ruleta." : `Resultado: ${activation.prize?.label ?? ""}.`}
              celebrate={activation.outcome !== "none" && activation.outcome !== "claimed"}
              onReveal={() => {
                setRevealed(true);
                setHeld(null);
              }}
            >
              <TicketPrize activation={activation} />
            </ScratchCard>
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

type Foil = "navidad" | "virtual";

function ScratchCard({
  label,
  foil = "navidad",
  result,
  celebrate = false,
  children,
  onReveal,
}: {
  label: string;
  foil?: Foil;
  /** Lluvia de papelitos al descubrir: solo si hay premio. */
  celebrate?: boolean;
  /** Lo que se anuncia a lectores de pantalla al descubrir. */
  result: string;
  children: ReactNode;
  onReveal: () => void;
}) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prizeRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);
  const s = useRef({ drawing: false, last: null as { x: number; y: number } | null, moves: 0, flakeAt: 0, done: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let alive = true;
    const paint = () => alive && !s.current.done && paintFoil(canvas, foil);
    paint();
    // Repinta con las fuentes de la casa cuando terminen de cargar.
    void document.fonts?.ready.then(paint);
    return () => {
      alive = false;
    };
  }, [foil]);

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
    if (celebrate && !reduce && canvas) {
      confetti(canvas.getBoundingClientRect());
      playConfetti();
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

  return (
    <div className="rasp-scratch">
      <div className="rasp-scratch-row">
        <span className="rasp-label">{label}</span>
        {!done ? (
          <button type="button" className="link" onClick={reveal}>
            Descubrir todo
          </button>
        ) : null}
      </div>
      <div className={`rasp-card${foil === "virtual" ? " virtual" : ""}`}>
        <div className="rasp-prize" ref={prizeRef}>
          {children}
        </div>
        <canvas
          ref={canvasRef}
          className="rasp-foil"
          role="img"
          aria-label="Capa para raspar. Usa Descubrir todo si prefieres no raspar."
          onPointerDown={(e) => {
            if (s.current.done) return;
            setTouched(true);
            e.currentTarget.setPointerCapture(e.pointerId);
            s.current.drawing = true;
            s.current.last = point(e);
            scratchTo(e);
          }}
          onPointerMove={(e) => s.current.drawing && scratchTo(e)}
          onPointerUp={() => (s.current.drawing = false)}
          onPointerCancel={() => (s.current.drawing = false)}
        />
        {!touched && !done && !reduce ? (
          <span className="rasp-hand" aria-hidden="true">
            <Art kind="coin" />
          </span>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {done ? result : ""}
      </p>
      {!done ? <p className="muted-sm rasp-center">Raspa con el dedo para confirmar tu premio.</p> : null}
    </div>
  );
}

function TicketPrize({ activation }: { activation: TicketActivation }) {
  const { outcome, prize, voucher, claimed } = activation;
  return (
    <>
      {outcome === "claimed" ? <span className="rasp-stampmark">Retirado en caja</span> : null}
      <PrizeArt kind={outcome === "none" ? "wheel" : /jam[oó]n/i.test(prize?.label ?? "") ? "pan" : categoryArt(prize?.category)} win={outcome !== "none"} />
      <span className="rasp-kick">{outcome === "none" ? "Sin premio esta vez" : outcome === "claimed" ? "Tu ticket tenía" : "Ganaste"}</span>
      {outcome === "none" ? (
        <span className="rasp-name">Otra oportunidad</span>
      ) : outcome === "cash" ? (
        <span className="rasp-name money tab-nums">{prize?.label}</span>
      ) : (
        <span className="rasp-name">{prize?.label}</span>
      )}
      <span className="rasp-sub">
        {outcome === "none"
          ? "Gira la ruleta y gana un ticket virtual BC. Ya entras al sorteo del 6 de enero."
          : outcome === "cash"
            ? "en efectivo. Se cobra en caja con tu cédula."
            : outcome === "claimed"
              ? `Se entregó el ${claimed ? longDate(claimed.date) : ""}${claimed ? ` en ${claimed.branch}` : ""}.`
              : voucher
                ? "Retíralo en cualquier sede."
                : ""}
      </span>
    </>
  );
}

// Papel de cada capa: el ticket impreso (plata) y el ticket virtual del club (oro).
const FOILS: Record<Foil, { stops: string[]; band: string; motif: string; lines: [string, string] }> = {
  navidad: { stops: ["#bdb2a0", "#efe8dc", "#cfc4b2", "#f3ede3", "#b5a994"], band: "#b3261e", motif: "LA BODEGA ✦", lines: ["RASPA AQUÍ", "TU PREMIO DE NAVIDAD"] },
  virtual: { stops: ["#c98f3a", "#f6d896", "#dca552", "#fbe7b8", "#b77a2a"], band: "#6f4428", motif: "BODEGA CLUB ✦", lines: ["RASPA AQUÍ", "TICKET VIRTUAL BC"] },
};

function paintFoil(canvas: HTMLCanvasElement, foil: Foil) {
  const look = FOILS[foil];
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
  [0, 0.35, 0.55, 0.8, 1].forEach((at, i) => g.addColorStop(at, look.stops[i]));
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
    for (let x = -r.width; x < r.width; x += 116) ctx.fillText(look.motif, x + (Math.round(y / 30) % 2 ? 58 : 0), y);
  }
  ctx.restore();
  // Copos de nieve sueltos y una cinta de regalo detrás del texto.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  for (let i = 0; i < 16; i++) snowflake(ctx, Math.random() * r.width, Math.random() * r.height, 5 + Math.random() * 7);
  const cy = r.height / 2 + 10;
  ctx.fillStyle = look.band;
  ctx.fillRect(r.width / 2 - 9, 0, 18, r.height);
  ctx.beginPath();
  ctx.roundRect(r.width / 2 - 150, cy - 44, 300, 76, 14);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  ctx.fillRect(r.width / 2 - 150, cy - 40, 300, 3);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff3e2";
  ctx.font = `700 34px ${family}`;
  ctx.fillText(look.lines[0], r.width / 2, r.height / 2 + 4);
  ctx.font = `600 17px ${family}`;
  ctx.fillText(look.lines[1], r.width / 2, r.height / 2 + 30);
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

function snowflake(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    ctx.moveTo(x - Math.cos(a) * size, y - Math.sin(a) * size);
    ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
  }
  ctx.stroke();
}

const CONFETTI = ["#e2492a", "#f6cf6a", "#c73a63", "#7fa65a", "#fff3e2", "#ff8c42"];

// Papelitos que saltan desde el centro de la tarjeta al descubrir un premio.
function confetti(box: DOMRect) {
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  for (let i = 0; i < 46; i++) {
    const f = document.createElement("span");
    f.className = "rasp-confetti";
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    f.style.background = CONFETTI[i % CONFETTI.length];
    if (i % 3 === 0) f.style.borderRadius = "50%";
    document.body.appendChild(f);
    const a = Math.random() * Math.PI * 2;
    const v = 90 + Math.random() * 170;
    animate(
      f,
      {
        x: [0, Math.cos(a) * v, Math.cos(a) * v * 1.15],
        y: [0, Math.sin(a) * v - 60, Math.sin(a) * v + 140],
        rotate: [0, Math.random() * 720 - 360],
        opacity: [1, 1, 0],
      },
      { duration: 1.3 + Math.random() * 0.5, ease: [0.2, 0.7, 0.4, 1] },
    ).then(() => f.remove());
  }
}

/** Dibujo del premio; si ganó, con rayos de sol girando detrás. */
function PrizeArt({ kind, win }: { kind: string; win: boolean }) {
  return (
    <span className={`rasp-art${win ? " win" : ""}`}>
      {win ? (
        <svg className="rasp-rays" viewBox="-50 -50 100 100" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d="M0 0 L-5 -50 L5 -50Z" transform={`rotate(${i * 30})`} />
          ))}
        </svg>
      ) : null}
      <Art kind={kind} />
    </span>
  );
}

/** Copos que caen despacio sobre la tarjeta de Inicio. */
function Snow() {
  return (
    <span className="rasp-snow" aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 1.3) % 6}s`, animationDuration: `${6 + (i % 4)}s` }} />
      ))}
    </span>
  );
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
  const [chanceDone, setChanceDone] = useState(false);
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
    } else if (!activation.secondChance) {
      // Con segunda oportunidad se recarga al terminarla: los puntos no se adelantan.
      void reload();
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
      {activation.secondChance ? (
        <SecondChance chance={activation.secondChance} entries={promo.drawEntries} onDone={() => setChanceDone(true)} />
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
      {activation.secondChance && !chanceDone ? null : (
        <div className="rasp-actions">
          {outcome !== "none" || activation.secondChance?.voucher ? (
            <Link href={href("wallet")} className="btn btn-soft">
              <Wallet aria-hidden="true" />
              Ver Wallet
            </Link>
          ) : null}
          <button type="button" className="btn btn-pop" onClick={onAnother}>
            <RotateCw aria-hidden="true" />
            Otro ticket
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Ruleta de la segunda oportunidad: 3 de 5 casillas ganan, las mismas probabilidades que decide el servidor (60 %).
const CHANCE_SEGMENTS: SpinSegment[] = Array.from({ length: 5 }, (_, i) => {
  const win = i % 2 === 0;
  return { id: `bc-${i}`, label: win ? "Ticket BC" : "Casi", prizeType: "voucher", color: win ? "tomate" : "crema", icon: win ? "ticket" : "ticket-x", order: i };
});
const WIN_SLOTS = [0, 2, 4];
const LOSE_SLOTS = [1, 3];
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function SecondChance({ chance, entries, onDone }: { chance: TicketSecondChance; entries: number; onDone: () => void }) {
  const { flyToWallet, notify, reload } = useClub();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<SVGSVGElement>(null);
  const voucherRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const wheel = useWheelSpin({ count: CHANCE_SEGMENTS.length, rotorRef, pointerRef });
  const [phase, setPhase] = useState<"ready" | "spinning" | "landed" | "revealed">("ready");
  const [landedId, setLandedId] = useState<string | null>(null);

  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al aparecer
  }, []);

  async function spin() {
    if (phase !== "ready") return;
    // El resultado ya lo trae la activación; la rueda solo lo cuenta.
    const slots = chance.won ? WIN_SLOTS : LOSE_SLOTS;
    const index = slots[Math.floor(Math.random() * slots.length)];
    setPhase("spinning");
    if (reduce) {
      wheel.snap(index);
    } else {
      wheel.start();
      await wheel.land(index);
    }
    setLandedId(CHANCE_SEGMENTS[index].id);
    setPhase("landed");
    if (!chance.won) {
      void reload();
      onDone();
    }
  }

  function revealed() {
    setPhase("revealed");
    onDone();
    const { voucher, prize } = chance;
    if (voucher) {
      timers.current.push(
        window.setTimeout(() => {
          notify(Ticket, "Guardado en tu Wallet", `${voucher.title}. Retíralo en cualquier sede.`);
          flyToWallet(voucher, voucherRef.current, () => void reload());
        }, 900),
      );
    } else {
      notify(Sparkles, `Sumaste ${prize?.points ?? 0} pts`, "Premio de tu ticket virtual BC.");
      void reload();
    }
  }

  const won = phase === "landed" || phase === "revealed";
  return (
    <motion.section
      ref={rootRef}
      className="tile rasp-chance"
      aria-labelledby="rasp-chance-h"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.15 }}
    >
      <div className="rasp-head">
        <h2 id="rasp-chance-h">Segunda oportunidad</h2>
        <span className="rasp-label tab-nums">60 %</span>
      </div>
      <p className="muted-sm">6 de cada 10 tickets sin premio ganan un ticket virtual BC con un premio del club.</p>
      <div className="rasp-chance-wheel">
        <Wheel segments={CHANCE_SEGMENTS} winnerId={landedId} rotorRef={rotorRef} pointerRef={pointerRef} />
      </div>
      {phase === "ready" || phase === "spinning" ? (
        <button type="button" className="btn btn-pop rasp-submit" onClick={() => void spin()} aria-disabled={phase === "spinning" || undefined}>
          <WheelIcon aria-hidden="true" />
          {phase === "spinning" ? "Girando" : "Girar la ruleta"}
        </button>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {won ? (chance.won ? "Ganaste un ticket virtual BC. Ráspalo para ver tu premio." : "Esta vez no salió el ticket virtual.") : ""}
      </p>

      <AnimatePresence>
        {won && !chance.won ? (
          <motion.div key="lose" className="rasp-chance-msg" initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
            <Radio aria-hidden="true" />
            <p>
              Esta vez no salió el ticket. Igual es tu participación <b>{entries}</b> en el sorteo del 6 de enero.
            </p>
          </motion.div>
        ) : null}
        {won && chance.won ? (
          <motion.div
            key="win"
            className="rasp-chance-win"
            initial={reduce ? false : { opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.6, delay: 0.25 }}
          >
            <h3>
              Ganaste un <em>ticket virtual BC</em>
            </h3>
            <ScratchCard label={`Ticket virtual ${chance.virtualCode ?? ""}`} foil="virtual" celebrate result={`Tu ticket virtual trae: ${chance.prize?.label ?? ""}.`} onReveal={revealed}>
              <VirtualPrize chance={chance} />
            </ScratchCard>
            {phase === "revealed" && chance.voucher ? (
              <VoucherTicket innerRef={voucherRef} voucher={chance.voucher} chip="Ticket virtual BC" sub="Producto gratis en cualquier sede" />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

function VirtualPrize({ chance }: { chance: TicketSecondChance }) {
  const points = chance.prize?.points;
  return (
    <>
      <PrizeArt kind={points ? "coin" : categoryArt(chance.prize?.category)} win />
      <span className="rasp-kick">Tu ticket virtual trae</span>
      {points ? (
        <span className="rasp-name money tab-nums">
          +{points}
          <small> pts</small>
        </span>
      ) : (
        <span className="rasp-name">{chance.prize?.label}</span>
      )}
      <span className="rasp-sub">{points ? "Ya están en tu saldo del club." : "Guardado en tu Wallet. Retíralo en cualquier sede."}</span>
    </>
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
