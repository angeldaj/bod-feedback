"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { ChefHat, Eye, Lock, MapPinned, Pause, Play, RotateCcw, Send, ShoppingBag, Sparkles, Star } from "lucide-react";
import { useClub } from "../club-provider";
import { Pixel, useInView } from "../pixel-sprites";

/*
 * Pedidos en Bodega Club: vista previa visual. Las ventas online (bodega-api 071)
 * todavía no están enlazadas al socio, así que todo aquí es un pedido de ejemplo
 * que avanza solo. Sirve para mostrar lo que gana el socio al pedir con su cuenta:
 * seguir el estado, escribirle al chef, ver la ruta y calificar sumando puntos.
 */

const STAGES = [
  { id: "NEW", label: "Recibido", title: "Tu pedido llegó a la cocina", sub: "El chef ya tiene tu comanda." },
  { id: "PAYMENT_VERIFIED", label: "Pago listo", title: "Pago verificado", sub: "Confirmamos tu pago móvil." },
  { id: "PREPARING", label: "En el horno", title: "Estamos horneando", sub: "Tus cachitos están dorándose." },
  { id: "DISPATCHED", label: "En camino", title: "Va camino a tu casa", sub: "Sigue al repartidor en el mapa." },
  { id: "DELIVERED", label: "Entregado", title: "¡Buen provecho!", sub: "Califícalo y suma puntos." },
] as const;

const STEP_MS = 4800;
/** El tramo en camino dura más: es el que se ve en el mapa. */
const ROAD_MS = 9000;

const ORDER = {
  code: "P-000123",
  branch: "Sede Alta Vista",
  lines: [
    { name: "Cachitos de jamón", qty: 6 },
    { name: "Pan de jamón", qty: 1 },
    { name: "Café con leche grande", qty: 2 },
  ],
  total: 24.5,
  points: 25,
};

const NOTE_CHIPS = ["Bien tostados, por favor", "Sin cebolla", "Es para regalo", "Tocar el timbre"];
const CHEF_REPLIES = ["¡Anotado! Te lo dejo justo así.", "Listo, se lo paso a quien arma tu pedido.", "Hecho. Gracias por avisar."];
const FEEDBACK_POINTS = 50;

/* ---------- escena 8-bit del pedido ---------- */

function OrderScene({ stage }: { stage: number }) {
  const place = stage < 3 ? "kitchen" : stage === 3 ? "road" : "home";
  return (
    <div className="os" data-place={place} data-stage={stage} aria-hidden="true">
      <div className="os-sky" />
      <div className="os-set os-kitchen">
        <span className="os-oven">
          <Pixel sprite="oven" scale={4} fps={stage === 2 ? 0.18 : 0.4} />
          <i className="os-glow" />
        </span>
        <span className="os-chef">
          <span className="os-bubble">
            <Pixel sprite={stage === 2 ? "bread" : "ticket"} scale={3} />
            {stage === 1 ? <b className="os-stamp">OK</b> : null}
          </span>
          <Pixel sprite="chef" scale={4} fps={stage === 2 ? 0.22 : 0.6} />
        </span>
        <span className="os-pot">
          <i className="pk-steam a" />
          <i className="pk-steam b" />
          <Pixel sprite="pot" scale={4} fps={0.3} />
        </span>
      </div>
      <div className="os-set os-road">
        {/* dos tiras idénticas: el bucle de -50% no se nota ni en escritorio */}
        <span className="os-town">
          {Array.from({ length: 12 }, (_, i) => (
            <Pixel key={i} sprite={i % 2 ? "house" : "shop"} scale={3} />
          ))}
        </span>
        <span className="os-rider">
          <Pixel sprite="moto" scale={4} fps={0.14} />
        </span>
      </div>
      <div className="os-set os-home">
        <Pixel sprite="house" scale={5} className="os-house" />
        <span className="os-parked">
          <Pixel sprite="moto" scale={4} />
        </span>
        <span className="os-stars">
          <Pixel sprite="star" scale={3} />
          <Pixel sprite="star" scale={2} />
          <Pixel sprite="star" scale={3} />
        </span>
      </div>
      <div className="os-floor" />
    </div>
  );
}

/* ---------- mapa: del horno a tu puerta ---------- */

const ROUTE = "M44 168 H124 V108 H212 V48 H276";
const SHOP_AT = { x: 44, y: 168 };
const HOME_AT = { x: 276, y: 48 };
const MAP_W = 320;
const MAP_H = 210;

function RouteMap({ stage, progress }: { stage: number; progress: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [rider, setRider] = useState(SHOP_AT);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const pt = path.getPointAtLength(path.getTotalLength() * progress);
    setRider({ x: pt.x, y: pt.y });
  }, [progress]);

  const eta = Math.max(1, Math.round(14 * (1 - progress)));
  const status = stage < 3 ? "Aún en la cocina" : stage === 3 ? `Llega en ~${eta} min` : "Entregado en tu puerta";
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <section className="tile ped-map" aria-labelledby="ped-map-h">
      <div className="sec-head">
        <h2 id="ped-map-h">Camino a tu casa</h2>
        <span className={`pill${stage === 3 ? " coral" : ""}`} aria-live="polite">
          <MapPinned aria-hidden="true" />
          {status}
        </span>
      </div>
      <div className="pm-box" data-moving={stage === 3 ? "" : undefined}>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="pm-svg" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
          {/* manzanas */}
          {Array.from({ length: 5 }, (_, cx) =>
            Array.from({ length: 4 }, (_, cy) => (
              <rect key={`${cx}-${cy}`} className={(cx + cy) % 3 === 0 ? "pm-park" : "pm-block"} x={8 + cx * 64} y={12 + cy * 52} width={48} height={32} rx={2} />
            )),
          )}
          <path className="pm-route" d={ROUTE} pathLength={100} />
          <path ref={pathRef} className="pm-done" d={ROUTE} pathLength={100} style={{ strokeDashoffset: 100 - progress * 100 }} />
        </svg>
        <span className="pm-pin pm-shop" style={{ left: pct(SHOP_AT.x, MAP_W), top: pct(SHOP_AT.y, MAP_H) }}>
          <Pixel sprite="shop" scale={2} />
        </span>
        <span className="pm-pin pm-home" style={{ left: pct(HOME_AT.x, MAP_W), top: pct(HOME_AT.y, MAP_H) }}>
          <Pixel sprite="house" scale={2} />
        </span>
        <span className="pm-rider" data-hidden={stage < 3 ? "" : undefined} style={{ left: pct(rider.x, MAP_W), top: pct(rider.y, MAP_H) }}>
          <Pixel sprite="moto" scale={2} fps={0.14} />
        </span>
      </div>
      <p className="muted-sm">Desde {ORDER.branch} hasta tu dirección guardada. En la versión real verás al repartidor moverse en vivo.</p>
    </section>
  );
}

/* ---------- notas al chef ---------- */

type Msg = { id: number; from: "me" | "chef"; text: string };

function ChefNotes({ stage, firstName }: { stage: number; firstName: string }) {
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: 0, from: "chef", text: `¡Hola, ${firstName}! Soy Luis, hoy estoy en el horno. ¿Algo que deba saber de tu pedido?` },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const seq = useRef(1);
  const timer = useRef<number | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  const closed = stage >= 3;

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing]);

  function send(text: string) {
    const t = text.trim();
    if (!t || closed) return;
    setMsgs((m) => [...m, { id: seq.current++, from: "me", text: t }]);
    setDraft("");
    setTyping(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: seq.current++, from: "chef", text: CHEF_REPLIES[m.length % CHEF_REPLIES.length] }]);
    }, 1200);
  }

  return (
    <section className="tile ped-notes" aria-labelledby="ped-notes-h">
      <div className="sec-head">
        <h2 id="ped-notes-h">Notas al chef</h2>
        <span className="muted-sm">{closed ? "Cerradas" : "Hasta que salga"}</span>
      </div>
      <div className="pn-list" ref={listRef} role="log" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`pn-msg ${m.from}`}>
            {m.from === "chef" ? (
              <span className="pn-av">
                <Pixel sprite="chef" scale={2} />
              </span>
            ) : null}
            <p>{m.text}</p>
          </div>
        ))}
        {typing ? (
          <div className="pn-msg chef">
            <span className="pn-av">
              <Pixel sprite="chef" scale={2} />
            </span>
            <p className="pn-typing" aria-label="Luis está escribiendo">
              <i />
              <i />
              <i />
            </p>
          </div>
        ) : null}
      </div>
      {closed ? (
        <p className="rule-note">
          <ChefHat aria-hidden="true" />
          <span>Tu pedido ya salió de la cocina. Las notas quedan guardadas con el pedido.</span>
        </p>
      ) : (
        <>
          <div className="pn-chips" role="group" aria-label="Notas rápidas">
            {NOTE_CHIPS.map((c) => (
              <button key={c} type="button" className="fchip" onClick={() => send(c)}>
                {c}
              </button>
            ))}
          </div>
          <form
            className="pn-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <label className="sr-only" htmlFor="pn-input">
              Escribe una nota para el chef
            </label>
            <input id="pn-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escribe una nota…" maxLength={140} autoComplete="off" />
            <button type="submit" className="btn btn-pop btn-sm" disabled={!draft.trim()} aria-label="Enviar nota">
              <Send aria-hidden="true" />
            </button>
          </form>
        </>
      )}
    </section>
  );
}

/* ---------- calificar y sumar ---------- */

function RateOrder({ stage, feedbackHref }: { stage: number; feedbackHref: string }) {
  const { notify } = useClub();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(false);
  const open = stage >= 4;
  const shown = hover || rating;

  return (
    <section className="tile ped-rate" data-open={open ? "" : undefined} aria-labelledby="ped-rate-h">
      <div className="pr-head">
        <div>
          <h2 id="ped-rate-h">¿Qué tal estuvo?</h2>
          <p>{open ? "Tu opinión llega directo a la sede y te suma puntos." : "Cuando llegue tu pedido, califícalo aquí."}</p>
        </div>
        <span className="pr-pts">
          +{FEEDBACK_POINTS}
          <small>pts</small>
        </span>
      </div>
      {!open ? (
        <p className="pr-lock">
          <Lock aria-hidden="true" />
          Se abre al entregar
        </p>
      ) : sent ? (
        <div className="pr-done" role="status">
          <Pixel sprite="star" scale={4} />
          <div>
            <b>¡Gracias! Sumaste {FEEDBACK_POINTS} pts.</b>
            <Link href={feedbackHref} className="link">
              Contar más en la encuesta
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="pr-stars" role="radiogroup" aria-label="Califica tu pedido" onPointerLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} de 5`}
                className="pr-star"
                data-on={n <= shown ? "" : undefined}
                onPointerEnter={() => setHover(n)}
                onClick={() => setRating(n)}
              >
                <Pixel sprite="star" scale={4} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-pop btn-block"
            disabled={!rating}
            onClick={() => {
              setSent(true);
              notify(Sparkles, `+${FEEDBACK_POINTS} pts por tu opinión`, "Vista previa: en la versión real se suman a tu saldo.");
            }}
          >
            <Star aria-hidden="true" />
            Calificar y sumar
          </button>
        </>
      )}
    </section>
  );
}

/* ---------- pantalla ---------- */

const PERKS = [
  { icon: Eye, title: "Ve tu pedido en vivo", text: "Del horno a tu puerta, paso a paso y sin escribir por WhatsApp." },
  { icon: ChefHat, title: "Háblale al chef", text: "Bien tostado, sin cebolla o para regalo: él lo lee antes de hornear." },
  { icon: MapPinned, title: "Ruta hasta tu casa", text: "Mira por dónde va el repartidor y cuánto le falta." },
  { icon: Sparkles, title: "Califica y suma", text: `Cada pedido suma puntos, y tu opinión te da +${FEEDBACK_POINTS} pts más.` },
] as const;

export function PedidosScreen() {
  const { member } = useClub();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [road, setRoad] = useState(0);
  const [liveRef, inView] = useInView<HTMLElement>("0px");
  const running = playing && inView && !reduce;
  const done = stage === STAGES.length - 1;

  // El pedido de ejemplo avanza solo mientras se ve.
  useEffect(() => {
    if (!running || done) return;
    const t = window.setTimeout(() => setStage((s) => s + 1), stage === 3 ? ROAD_MS : STEP_MS);
    return () => window.clearTimeout(t);
  }, [running, done, stage]);

  // El repartidor recorre el mapa durante "En camino".
  useEffect(() => {
    if (stage !== 3 || !running) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ROAD_MS);
      setRoad(0.04 + t * 0.9);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage, running]);
  // Pausado o con movimiento reducido, el repartidor espera a mitad de camino.
  const progress = stage < 3 ? 0 : stage > 3 ? 1 : running ? road : road || 0.45;

  function togglePlay() {
    if (done) {
      setStage(0);
      setRoad(0);
      setPlaying(true);
    } else setPlaying((p) => !p);
  }

  const current = STAGES[stage];
  const firstName = member?.firstName ?? "socia";

  return (
    <div className="view view-pedidos px-live">
      <div className="v-head">
        <div className="v-head-row">
          <h1>Pedidos</h1>
          <span className="pill coral">
            <Sparkles aria-hidden="true" />
            Muy pronto
          </span>
        </div>
        <p>Pide online con tu cuenta del club y síguelo todo desde aquí.</p>
      </div>

      <p className="rule-note">
        <Eye aria-hidden="true" />
        <span>Vista previa: así se verá un pedido con Bodega Club. Lo que ves es un pedido de ejemplo que avanza solo; puedes tocar cada paso.</span>
      </p>

      <section ref={liveRef} className="tile ped-live" data-paused={running ? undefined : ""} aria-labelledby="ped-live-h">
        <div className="pl-head">
          <div>
            <small>
              {ORDER.code} · Delivery · {ORDER.branch.replace(/^Sede /, "")}
            </small>
            <h2 id="ped-live-h" aria-live="polite">
              {current.title}
            </h2>
            <p>{current.sub}</p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={togglePlay}
            aria-label={done ? "Repetir el pedido de ejemplo" : playing ? "Pausar el pedido de ejemplo" : "Reanudar el pedido de ejemplo"}
          >
            {done ? <RotateCcw aria-hidden="true" /> : playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
        </div>

        <OrderScene stage={stage} />

        <ol className="pl-steps" style={{ "--at": stage } as React.CSSProperties}>
          {STAGES.map((s, i) => (
            <li key={s.id} data-state={i < stage ? "done" : i === stage ? "now" : "next"}>
              <button
                type="button"
                aria-current={i === stage ? "step" : undefined}
                onClick={() => {
                  setStage(i);
                  setRoad(0);
                  setPlaying(false);
                }}
              >
                <i aria-hidden="true" />
                <span>{s.label}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="pl-order">
          <ul>
            {ORDER.lines.map((l) => (
              <li key={l.name}>
                <span>{l.name}</span>
                <span className="tab-nums">x{l.qty}</span>
              </li>
            ))}
          </ul>
          <div className="pl-total">
            <strong className="tab-nums">${ORDER.total.toFixed(2)}</strong>
            <small>+{ORDER.points} pts al entregarse</small>
          </div>
        </div>
      </section>

      <div className="ped-grid">
        <RouteMap stage={stage} progress={progress} />
        <ChefNotes stage={stage} firstName={firstName} />
      </div>

      <RateOrder stage={stage} feedbackHref="/feedback" />

      <section aria-labelledby="ped-perks-h" className="ped-perks-wrap">
        <div className="sec-head">
          <h2 id="ped-perks-h">Por qué pedir con el club</h2>
        </div>
        <ul className="ped-perks">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="tile">
              <span className="pp-ic">
                <Icon aria-hidden="true" />
              </span>
              <b>{title}</b>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="tile ped-cta">
        <Pixel sprite="moto" scale={3} fps={0.2} className="pc-moto" />
        <div>
          <b>¿Antojo ahora?</b>
          <p>Mientras llega al club, ya puedes pedir en la web.</p>
        </div>
        <Link href="/pedidos" className="btn btn-pop btn-sm">
          <ShoppingBag aria-hidden="true" />
          Pedir
        </Link>
      </section>
    </div>
  );
}
