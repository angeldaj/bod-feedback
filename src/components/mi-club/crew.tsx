"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import type { CrewName, CREW_ART } from "./crew-art";

/*
 * Bienvenida de Inicio con los personajes del Club (pack vectorial de cafetería):
 * el barista escribe el saludo en la pizarra y el chef trae la torta; el mesonero
 * sirve la tarjeta. Cada movimiento es un paso de la historia, no un adorno en loop.
 * Corre una vez por sesión; con `prefers-reduced-motion` todo aparece en su sitio.
 * El arte (~90 KB) se carga aparte con `import()` solo cuando hace falta.
 */

type Art = typeof CREW_ART;
const SEEN_KEY = "club-intro-seen";
const SPEED = 75; // unidades del pack por segundo al caminar

/** `true` si la bienvenida animada todavía no se vio en esta sesión y el sistema permite movimiento. */
export function introPending() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  try {
    return sessionStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // sin almacenamiento solo se repite la bienvenida
  }
}

function useCrewArt() {
  const [art, setArt] = useState<Art | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    import("./crew-art").then(
      (m) => live && setArt(m.CREW_ART),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, []);
  return { art, failed };
}

/** Animaciones cancelables: al desmontar (o en el doble montaje de StrictMode) la historia se corta sin romper nada. */
function director(signal: AbortSignal) {
  const wait = (ms: number) =>
    new Promise<void>((done, fail) => {
      const t = window.setTimeout(done, ms);
      signal.addEventListener("abort", () => (window.clearTimeout(t), fail(signal.reason)), { once: true });
    });
  const play = async (el: Element, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
    const a = el.animate(frames, { fill: "forwards", ...opts });
    signal.addEventListener("abort", () => a.cancel(), { once: true });
    await a.finished;
    return a;
  };
  return { wait, play };
}
type Director = ReturnType<typeof director>;

/** Un personaje: `.crew` > `.crew-pos` (dónde está) > `.crew-bob` (sus piezas). */
type Actor = { g: SVGGElement; pos: SVGGElement; x: number };
function actor(svg: SVGSVGElement | null, name: CrewName): Actor | null {
  const g = svg?.querySelector<SVGGElement>(`.crew-${name}`);
  const pos = g?.querySelector<SVGGElement>(".crew-pos");
  return g && pos ? { g, pos, x: 0 } : null;
}
function place(a: Actor, x: number) {
  a.x = x;
  a.pos.style.transform = `translate(${x}px, 0)`;
}
async function walk(d: Director, a: Actor, to: number, ms = (Math.abs(to - a.x) / SPEED) * 1000) {
  a.g.classList.add("walking");
  try {
    const anim = await d.play(a.pos, [{ transform: `translate(${a.x}px, 0)` }, { transform: `translate(${to}px, 0)` }], { duration: ms, easing: "linear" });
    place(a, to);
    anim.cancel();
  } finally {
    a.g.classList.remove("walking");
  }
}

function CrewMember({ art, name }: { art: Art; name: CrewName }) {
  const { svg, shoulder } = art[name];
  return (
    <g className={`crew crew-${name}`} style={{ "--shoulder": `${shoulder[0]}px ${shoulder[1]}px` } as React.CSSProperties}>
      <g className="crew-pos">
        <g className="crew-bob" dangerouslySetInnerHTML={{ __html: svg }} />
      </g>
    </g>
  );
}

// ---------- 1. saludo ----------

const HAND_X = 296; // mano del barista (con la tiza) en coordenadas del pack
const BOARD_X = 84; // inicio del texto en la pizarra
const BOARD_W = 108; // ancho útil para el saludo
const AWAY = { barista: -330, chef: 330 };
const REST = { barista: BOARD_X - HAND_X - 14, chef: 175 }; // el barista queda con la mano en el marco, sin tapar el saludo

/**
 * El barista escribe "Hola, {nombre}" en la pizarra y, al terminar, aparece el título
 * real (`onStep(1)`); luego el chef llega con la torta (`onStep(2)`). `play=false` pinta el final.
 */
export function HelloCrew({ name, play, onStep, className = "" }: { name: string; play: boolean; onStep: (step: 1 | 2) => void; className?: string }) {
  const { art, failed } = useCrewArt();
  const svgRef = useRef<SVGSVGElement>(null);
  const chalkRef = useRef<SVGTextElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const step = useEffectEvent(onStep);

  // Sin arte no hay historia: el texto real no espera.
  useEffect(() => {
    if (failed) {
      step(1);
      step(2);
    }
  }, [failed]);

  useLayoutEffect(() => {
    const barista = actor(svgRef.current, "barista"), chef = actor(svgRef.current, "chef");
    const chalk = chalkRef.current, clip = clipRef.current, line = lineRef.current;
    if (!art || !barista || !chef || !chalk || !clip || !line) return;

    // Nombres largos: la letra se achica para caber en la pizarra.
    chalk.setAttribute("font-size", "22");
    let w = chalk.getComputedTextLength();
    if (w > BOARD_W) {
      chalk.setAttribute("font-size", ((22 * BOARD_W) / w).toFixed(1));
      w = chalk.getComputedTextLength();
    }
    const showBoard = () => {
      clip.setAttribute("width", String(w + 4));
      line.style.opacity = "0.8";
    };

    if (!play) {
      place(barista, REST.barista);
      place(chef, REST.chef);
      chef.g.classList.add("lift");
      showBoard();
      step(1);
      step(2);
      return;
    }

    const ctl = new AbortController();
    const d = director(ctl.signal);
    place(barista, AWAY.barista);
    place(chef, AWAY.chef);
    clip.setAttribute("width", "0");
    line.style.opacity = "0";

    (async () => {
      await d.wait(350);
      await walk(d, barista, BOARD_X - HAND_X);
      // Escribe: el texto se descubre al mismo ritmo que avanza la mano.
      barista.g.classList.add("writing");
      const ms = 260 + w * 15;
      const t0 = performance.now();
      let raf = requestAnimationFrame(function frame(now) {
        clip.setAttribute("width", String(Math.min(1, (now - t0) / ms) * w + 2));
        raf = requestAnimationFrame(frame);
      });
      ctl.signal.addEventListener("abort", () => cancelAnimationFrame(raf), { once: true });
      await walk(d, barista, BOARD_X - HAND_X + w, ms);
      cancelAnimationFrame(raf);
      barista.g.classList.remove("writing");
      showBoard();
      step(1); // la pizarra le pasa la posta al título real
      await walk(d, barista, REST.barista);
      await walk(d, chef, REST.chef);
      chef.g.classList.add("lift");
      step(2);
    })().catch(() => {});

    return () => {
      ctl.abort();
      barista.g.classList.remove("walking", "writing");
      chef.g.classList.remove("walking", "lift");
    };
  }, [art, play, name]);

  return (
    <svg ref={svgRef} className={`crew-scene crew-hello ${className}`} viewBox="0 52 300 186" aria-hidden="true" focusable="false">
      <ellipse cx="150" cy="231" rx="150" ry="5" className="crew-floor" />
      <path d="M84 150 L70 230 M188 150 L202 230" className="crew-easel" />
      <rect x="70" y="76" width="132" height="78" rx="4" className="crew-frame" />
      <rect x="76" y="82" width="120" height="66" rx="2" className="crew-slate" />
      <text x="136" y="96" textAnchor="middle" fontSize="9" className="crew-chalk crew-chalk-small">
        Bodega Club
      </text>
      <clipPath id="crew-chalk-clip">
        <rect ref={clipRef} x={BOARD_X - 2} y="96" width="0" height="34" />
      </clipPath>
      <text ref={chalkRef} x={BOARD_X} y="124" fontSize="22" clipPath="url(#crew-chalk-clip)" className="crew-chalk">
        Hola, {name}
      </text>
      <path ref={lineRef} d="M88 134 q40 4 96 -1" className="crew-underline" />
      {art ? (
        <>
          <CrewMember art={art} name="barista" />
          <CrewMember art={art} name="chef" />
        </>
      ) : null}
    </svg>
  );
}

// ---------- 2. tarjeta ----------

const TRAY_STOP = 39.5; // la bandeja queda al centro de la escena
const WAITER_AWAY = 330;

/**
 * Escenario de la tarjeta. Con `serve`, el mesonero la trae en miniatura en su bandeja
 * y la tarjeta real despega desde ahí hasta su lugar; al salir de escena se desmonta.
 */
export function CardStage({ serve, children }: { serve: boolean; children: React.ReactNode }) {
  const [pending, setServing] = useState(serve);
  const { art, failed } = useCrewArt();
  const serving = pending && !failed; // sin arte, la tarjeta está en su sitio desde el principio
  const sceneRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // La tarjeta se esconde antes del primer cuadro: llega servida.
  useLayoutEffect(() => {
    const card = sceneRef.current;
    if (!serving || !card) return;
    card.style.visibility = "hidden";
    return () => {
      card.style.visibility = "";
    };
  }, [serving]);

  useLayoutEffect(() => {
    const card = sceneRef.current, waiter = actor(svgRef.current, "mesonero");
    if (!serving || !art || !card || !waiter) return;
    const mini = waiter.g.querySelector<SVGGElement>(".crew-mini");
    const ctl = new AbortController();
    const d = director(ctl.signal);
    place(waiter, WAITER_AWAY);

    (async () => {
      await d.wait(450);
      await walk(d, waiter, TRAY_STOP);
      waiter.g.classList.add("lift");
      await d.wait(380);
      // FLIP: la tarjeta real arranca con el tamaño y lugar de la miniatura de la bandeja.
      const from = (mini ?? waiter.g).getBoundingClientRect();
      const to = card.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      if (mini) mini.style.opacity = "0";
      card.style.visibility = "";
      const fly = await d.play(
        card,
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width})` },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 30}px) scale(0.55) rotate(-4deg)`, offset: 0.45 },
          { transform: "none" },
        ],
        { duration: 900, easing: "cubic-bezier(.3,.7,.2,1)" },
      );
      fly.cancel();
      waiter.g.classList.remove("lift");
      waiter.g.classList.add("bow");
      await d.wait(650);
      waiter.g.classList.remove("bow");
      await d.wait(200);
      await walk(d, waiter, WAITER_AWAY);
      setServing(false);
    })().catch(() => {});

    return () => {
      ctl.abort();
      waiter.g.classList.remove("walking", "lift", "bow");
      if (mini) mini.style.opacity = "";
    };
  }, [art, serving]);

  return (
    <div className="card-stage">
      <div className="card-scene" ref={sceneRef}>
        {children}
      </div>
      {serving ? (
        <svg ref={svgRef} className="crew-scene crew-waiter" viewBox="0 58 400 180" aria-hidden="true" focusable="false">
          {art ? <CrewMember art={art} name="mesonero" /> : null}
        </svg>
      ) : null}
    </div>
  );
}
