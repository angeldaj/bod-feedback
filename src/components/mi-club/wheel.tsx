"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import type { SpinSegment, SpinWheel } from "@/lib/club-api";
import { Art } from "./illustrations";

// ---------------------------------------------------------------------------
// Claves de diseño del backend → tokens del frontend (spec 077). Una clave
// desconocida cae al estilo por defecto: club-web puede publicar claves nuevas
// antes de que la landing las conozca.
// ---------------------------------------------------------------------------

const SEGMENT_COLORS = new Set(["crema", "mostaza", "cafe", "tomate", "oro", "trigo", "frambuesa", "naranja"]);

// Clave de ícono del backend → dibujo (illustrations.tsx).
const SEGMENT_ART: Record<string, string> = {
  coin: "coin",
  coins: "coin",
  coffee: "coffee",
  percent: "percent",
  star: "star",
  croissant: "croissant",
  cake: "cake",
  juice: "juice",
  ticket: "ticket",
  "ticket-x": "ticket-x",
};
const segmentArt = (key: string | null | undefined) => (key && SEGMENT_ART[key]) || "wheel";

/** Dibujo de un segmento por su clave (o la ruleta si la clave no se conoce). */
export function SegmentGlyph({ icon }: { icon: string | null | undefined }) {
  return <Art kind={segmentArt(icon)} />;
}
export const segmentTone = (color: string) => `seg-${SEGMENT_COLORS.has(color) ? color : "default"}`;
export const sortedSegments = (wheel: SpinWheel) => [...wheel.segments].sort((a, b) => a.order - b.order);

// ---------------------------------------------------------------------------
// Rueda (SVG). Ángulos en grados, sentido horario desde las 12; el puntero está
// fijo arriba y lo que gira es el rotor.
// ---------------------------------------------------------------------------

const R = 170;
const xy = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [+(r * Math.sin(a)).toFixed(2), +(-r * Math.cos(a)).toFixed(2)];
};
const pt = (r: number, deg: number) => xy(r, deg).join(" ");

function slicePath(a0: number, a1: number): string {
  return `M0 0 L${pt(R, a0)} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${pt(R, a1)}Z`;
}

// Bombillos de feria en el aro: se encienden alternados y bailan al ganar.
const BULBS = 24;

/**
 * Nombre de la casilla junto al aro, en una o dos líneas, con la letra que
 * quepa en la cuerda del segmento.
 */
function labelLines(label: string, n: number): { lines: string[]; size: number } {
  const words = label.trim().split(/\s+/);
  let lines = [label];
  if (label.length > 10 && words.length > 1) {
    // Corta en el espacio que deja las dos líneas más parejas.
    let best = 1;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ").length;
      const b = words.slice(i).join(" ").length;
      const prev = Math.abs(words.slice(0, best).join(" ").length - words.slice(best).join(" ").length);
      if (Math.abs(a - b) < prev) best = i;
    }
    lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
  }
  const chord = 2 * R * 0.84 * Math.sin(Math.PI / n);
  const longest = Math.max(...lines.map((l) => l.length));
  return { lines, size: Math.min(n > 8 ? 12 : 14, (chord * 0.86) / (longest * 0.62)) };
}

/** Rotación inicial: el primer segmento centrado bajo el puntero. */
export const restAngle = (count: number) => -180 / Math.max(count, 1);

export function Wheel({
  segments,
  mini = false,
  winnerId = null,
  rotorRef,
  pointerRef,
}: {
  segments: SpinSegment[];
  mini?: boolean;
  winnerId?: string | null;
  rotorRef?: RefObject<HTMLDivElement | null>;
  pointerRef?: RefObject<SVGSVGElement | null>;
}) {
  const n = segments.length;
  const step = 360 / n;
  const artSize = n > 8 ? 42 : 54;
  return (
    <div className={`wheel${mini ? " mini" : ""}`} data-won={winnerId ? "true" : undefined} aria-hidden="true">
      <div className="wheel-rotor" ref={rotorRef} style={{ transform: `rotate(${restAngle(n)}deg)` }}>
        <svg viewBox="-200 -200 400 400" focusable="false">
          <circle r={R + 22} className="wheel-rim" />
          <circle r={R + 22} className="wheel-rim-hi" />
          {segments.map((seg, i) => {
            const c = (i + 0.5) * step;
            return (
              <g key={seg.id} className={`seg ${segmentTone(seg.color)}${seg.id === winnerId ? " win" : ""}`}>
                <path d={slicePath(i * step, (i + 1) * step)} />
                {mini ? null : (
                  <g transform={`rotate(${c})`}>
                    <g className="seg-art" transform={`translate(0 ${-R * 0.5})`}>
                      <circle className="seg-art-bg" r={artSize * 0.52} />
                      <Art kind={segmentArt(seg.icon)} x={-artSize / 2} y={-artSize / 2} width={artSize} height={artSize} />
                    </g>
                    <SegLabel label={seg.label} n={n} />
                  </g>
                )}
              </g>
            );
          })}
          {segments.map((seg, i) => {
            const [x, y] = xy(R, i * step);
            return <line key={`d-${seg.id}`} className="wheel-div" x1="0" y1="0" x2={x} y2={y} />;
          })}
          {mini
            ? null
            : Array.from({ length: BULBS }, (_, i) => {
                const [x, y] = xy(R + 11, (i * 360) / BULBS);
                return <circle key={`s-${i}`} className={`wheel-bulb ${i % 2 ? "b" : "a"}`} cx={x} cy={y} r="4.4" />;
              })}
        </svg>
      </div>
      {mini ? null : <span className="wheel-gloss" />}
      <span className="wheel-hub">
        <Image src="/logo-bodega.png" alt="" width={48} height={48} />
      </span>
      <svg className="wheel-pointer" ref={pointerRef} viewBox="0 0 40 52" focusable="false">
        <path d="M20 50C12 38 3 27 3 18a17 17 0 0 1 34 0c0 9-9 20-17 32Z" />
        <circle cx="20" cy="18" r="6" />
      </svg>
    </div>
  );
}

function SegLabel({ label, n }: { label: string; n: number }) {
  const { lines, size } = labelLines(label, n);
  return (
    <text className="seg-label" fontSize={size}>
      {lines.map((l, i) => (
        <tspan key={i} x="0" y={-R * 0.84 + i * size * 1.05}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Física del giro. La rueda arranca al tocar (sin esperar la red): pequeño
// amago hacia atrás, aceleración y crucero. Cuando llega el resultado frena
// con una cúbica cuya velocidad inicial es la de crucero (sin saltos), y la
// distancia se elige para caer justo en el segmento devuelto.
// ---------------------------------------------------------------------------

const WINDUP_S = 0.14;
const WINDUP_DEG = 9;
const ACCEL_S = 0.45;
const MIN_CRUISE_S = 0.35;
const OMEGA = 760; // °/s de crucero
const MIN_LAND_DEG = 540; // al menos vuelta y media de frenado
const MIN_NEUTRAL_DEG = 200;

type Stop = { kind: "segment"; index: number; offset: number } | { kind: "neutral" };
type Run =
  | { phase: "up"; t0: number; base: number; stop: Stop | null; done: (() => void) | null }
  | { phase: "down"; t0: number; from: number; dist: number; dur: number; done: (() => void) | null };

const mod = (a: number, m: number) => ((a % m) + m) % m;

export function useWheelSpin({
  count,
  rotorRef,
  pointerRef,
}: {
  count: number;
  rotorRef: RefObject<HTMLDivElement | null>;
  pointerRef: RefObject<SVGSVGElement | null>;
}) {
  const angle = useRef(restAngle(count));
  const run = useRef<Run | null>(null);
  const frame = useRef(0);
  const lastSlot = useRef(0);
  const step = 360 / Math.max(count, 1);

  const paint = useCallback(
    (deg: number, ticks: boolean) => {
      angle.current = deg;
      const rotor = rotorRef.current;
      if (rotor) rotor.style.transform = `rotate(${deg}deg)`;
      // El puntero "pica" con cada divisoria que pasa: la única realimentación táctil en pantalla.
      const slot = Math.floor(deg / step);
      if (ticks && slot !== lastSlot.current) {
        pointerRef.current?.animate([{ transform: "rotate(-18deg)" }, { transform: "rotate(0deg)" }], {
          duration: 150,
          easing: "cubic-bezier(0.23, 1, 0.32, 1)",
        });
      }
      lastSlot.current = slot;
    },
    [pointerRef, rotorRef, step],
  );

  const beginDown = useCallback(
    (now: number, from: number, stop: Stop, done: (() => void) | null) => {
      const dist =
        stop.kind === "segment"
          ? (() => {
              const center = (stop.index + 0.5 + stop.offset) * step;
              let d = mod(-center - from, 360);
              while (d < MIN_LAND_DEG) d += 360;
              return d;
            })()
          : (() => {
              let d = mod(-from, step);
              while (d < MIN_NEUTRAL_DEG) d += step;
              return d;
            })();
      // p(u) = 1 - (1 - u)^3 arranca con velocidad 3·dist/dur: igualarla al crucero.
      run.current = { phase: "down", t0: now, from, dist, dur: (3 * dist) / OMEGA, done };
    },
    [step],
  );

  /** Un cuadro de la animación; `false` cuando la rueda ya se detuvo. */
  const advance = useCallback(
    (now: number): boolean => {
      const r = run.current;
      if (!r) return false;
      if (r.phase === "up") {
        const t = (now - r.t0) / 1000;
        let deg: number;
        if (t < WINDUP_S) {
          deg = r.base - WINDUP_DEG * Math.sin((Math.PI / 2) * (t / WINDUP_S));
        } else {
          const tt = t - WINDUP_S;
          const start = r.base - WINDUP_DEG;
          deg =
            tt < ACCEL_S
              ? start + (OMEGA * tt ** 3) / (3 * ACCEL_S ** 2)
              : start + (OMEGA * ACCEL_S) / 3 + OMEGA * (tt - ACCEL_S);
          if (r.stop && tt >= ACCEL_S + MIN_CRUISE_S) beginDown(now, deg, r.stop, r.done);
        }
        paint(deg, t >= WINDUP_S);
      } else {
        const u = Math.min(1, (now - r.t0) / 1000 / r.dur);
        paint(r.from + r.dist * (1 - (1 - u) ** 3), true);
        if (u >= 1) {
          run.current = null;
          r.done?.();
          return false;
        }
      }
      return true;
    },
    [beginDown, paint],
  );

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /** Arranca el giro ya, antes de saber el premio. */
  const start = useCallback(() => {
    cancelAnimationFrame(frame.current);
    run.current = { phase: "up", t0: performance.now(), base: angle.current, stop: null, done: null };
    lastSlot.current = Math.floor(angle.current / step);
    const loop = (now: number) => {
      if (advance(now)) frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
  }, [advance, step]);

  /** Programa la parada; resuelve cuando la rueda se detiene. */
  const stopAt = useCallback(
    (stop: Stop) =>
      new Promise<void>((resolve) => {
        const r = run.current;
        if (!r) return resolve();
        if (r.phase === "up") {
          r.stop = stop;
          r.done = resolve;
        } else {
          r.done = resolve;
        }
      }),
    [],
  );

  /** Aterriza en el segmento `index`, con un desvío al azar dentro del segmento. */
  const land = useCallback(
    (index: number) => stopAt({ kind: "segment", index, offset: (Math.random() - 0.5) * 0.6 }),
    [stopAt],
  );

  /** Frena en una divisoria: no parece premio de nadie. */
  const neutral = useCallback(() => stopAt({ kind: "neutral" }), [stopAt]);

  /** Movimiento reducido: sin giro, la rueda queda directamente en el segmento. */
  const snap = useCallback(
    (index: number) => {
      cancelAnimationFrame(frame.current);
      run.current = null;
      const center = (index + 0.5) * step;
      paint(angle.current + mod(-center - angle.current, 360), false);
    },
    [paint, step],
  );

  return { start, land, neutral, snap };
}

// ---------------------------------------------------------------------------
// Progreso hacia la próxima tirada: una marca por compra (●●○).
// ---------------------------------------------------------------------------

export function SpinProgress({ current, required }: { current: number; required: number }) {
  const left = Math.max(0, required - current);
  const label = `${current} de ${required} ${required === 1 ? "compra" : "compras"} para tu próxima tirada`;
  return (
    <div className="spin-prog">
      {required <= 10 ? (
        <span className="marks" role="img" aria-label={label}>
          {Array.from({ length: required }, (_, i) => (
            <i key={i} data-on={i < current ? "true" : undefined} />
          ))}
        </span>
      ) : (
        <span className="track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={required} aria-valuenow={current}>
          <span style={{ width: `${(current / required) * 100}%` }} />
        </span>
      )}
      <small aria-hidden="true">
        {left === 1 ? "Te falta 1 compra" : `Te faltan ${left} compras`} para la próxima
      </small>
    </div>
  );
}
