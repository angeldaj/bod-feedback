"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PixelParade } from "./pixel-sprites";

/*
 * Escenografía de panadería del área de socios: fondo de trigo en relieve con
 * harina en el aire, el pan que se hornea (saludo y carga) y el trigal que se
 * mece en el pie de página. Todo es decorativo (`aria-hidden`), anima solo
 * `transform`/`opacity` y se queda quieto con `prefers-reduced-motion`.
 */

/** PRNG con semilla: el trigal sale igual en servidor y cliente (sin saltos de hidratación). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Fondo fijo: espigas en bajorrelieve sobre la "masa" del fondo y harina que cae despacio. */
export function BakeryBackdrop() {
  const flour = useMemo(() => {
    const rnd = seeded(7);
    return Array.from({ length: 16 }, (_, i) => ({
      left: r2(rnd() * 100),
      size: r2(2 + rnd() * 3.5),
      dur: r2(18 + rnd() * 16),
      delay: r2(-rnd() * 30),
      drift: r2((rnd() - 0.5) * 60),
      key: i,
    }));
  }, []);

  return (
    <div className="bk-bg" aria-hidden="true">
      <div className="bk-relief">
        <i className="hi" />
        <i className="lo" />
        <i className="face" />
      </div>
      <div className="bk-wash" />
      <div className="bk-flour">
        {flour.map((f) => (
          <i
            key={f.key}
            style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, "--drift": `${f.drift}px` } as React.CSSProperties}
          />
        ))}
      </div>
      <PixelParade />
    </div>
  );
}

/**
 * Horno de ladrillo con un pan que crece, se dora, abre sus cortes y echa vapor.
 * `loop` repite el horneado (pantalla de carga); sin él hornea una vez y queda humeando.
 */
export function BakingLoaf({ loop = false, className = "" }: { loop?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`bake${loop ? " loop" : ""} ${className}`} viewBox="0 0 240 200" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-fire`} cx="50%" cy="92%" r="70%">
          <stop offset="0%" stopColor="#ffb25a" stopOpacity="0.95" />
          <stop offset="38%" stopColor="#e2592a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1a0d07" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-crust`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9a24c" />
          <stop offset="55%" stopColor="#c46d2a" />
          <stop offset="100%" stopColor="#8a3f17" />
        </linearGradient>
        <linearGradient id={`${id}-dough`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbecd0" />
          <stop offset="100%" stopColor="#e9cfa2" />
        </linearGradient>
        <clipPath id={`${id}-mouth`}>
          <path d="M52 182 V112 A68 68 0 0 1 188 112 V182 Z" />
        </clipPath>
      </defs>

      {/* bóveda de ladrillo */}
      <path className="bk-vault" d="M18 186 V108 A102 102 0 0 1 222 108 V186 Z" />
      <path className="bk-bricks" d="M35 186 V110 A85 85 0 0 1 205 110 V186" />
      <path className="bk-bricks thin" d="M26 150 H48 M192 150 H214 M26 170 H48 M192 170 H214" />
      <path className="bk-mouth" d="M52 182 V112 A68 68 0 0 1 188 112 V182 Z" />

      <g clipPath={`url(#${id}-mouth)`}>
        <rect className="bk-fire" x="40" y="60" width="160" height="130" fill={`url(#${id}-fire)`} />
        <circle className="bk-ember e1" cx="72" cy="176" r="2.4" />
        <circle className="bk-ember e2" cx="168" cy="174" r="2" />
        <circle className="bk-ember e3" cx="150" cy="178" r="1.6" />

        {/* el pan */}
        <g className="bk-loaf">
          <path d="M66 176 C64 142 92 126 120 126 C148 126 176 142 174 176 Z" fill={`url(#${id}-dough)`} />
          <path className="bk-crust" d="M66 176 C64 142 92 126 120 126 C148 126 176 142 174 176 Z" fill={`url(#${id}-crust)`} />
          <path className="bk-score" d="M88 160 C96 150 104 144 112 141 M108 162 C116 151 124 146 133 143 M128 164 C136 154 144 149 152 147" />
          <ellipse className="bk-sheen" cx="104" cy="138" rx="18" ry="5" />
        </g>
      </g>

      {/* pala y vapor */}
      <rect className="bk-peel" x="44" y="180" width="152" height="7" rx="3.5" />
      <g className="bk-steam">
        <path className="s1" d="M104 120 c-7 -9 7 -15 0 -24 c-7 -9 7 -15 0 -24" />
        <path className="s2" d="M122 116 c-7 -9 7 -15 0 -24 c-7 -9 7 -15 0 -24" />
        <path className="s3" d="M140 120 c-7 -9 7 -15 0 -24 c-7 -9 7 -15 0 -24" />
      </g>
    </svg>
  );
}

type Blade = { kind: "stalk" | "grass"; layer: 0 | 1 | 2; x: number; d: string; ear?: string; delay: number; amp: number; dur: number };

const FIELD_W = 1200;
const FIELD_H = 170;
/** Aire sobre el campo: las espigas más altas y sus barbas sobresalen de FIELD_H. */
const FIELD_TOP = 48;

function buildField(): Blade[] {
  const rnd = seeded(2026);
  const out: Blade[] = [];
  // Tres capas: atrás espigas pequeñas y claras, al medio espigas grandes, delante pasto oscuro.
  const layers: { layer: 0 | 1 | 2; n: number; kind: Blade["kind"]; h: [number, number] }[] = [
    { layer: 0, n: 52, kind: "stalk", h: [64, 98] },
    { layer: 1, n: 38, kind: "stalk", h: [96, 140] },
    { layer: 2, n: 96, kind: "grass", h: [24, 66] },
  ];
  for (const { layer, n, kind, h } of layers) {
    for (let i = 0; i < n; i++) {
      const x = r2(((i + rnd() * 0.9) / n) * FIELD_W);
      const height = h[0] + rnd() * (h[1] - h[0]);
      const lean = (rnd() - 0.5) * (kind === "grass" ? 26 : 34);
      const topX = x + lean;
      const topY = FIELD_H - height;
      // La ola de viento recorre el campo de izquierda a derecha: el retraso depende de x.
      const delay = r2(-(x / FIELD_W) * 4.2 - rnd() * 0.6);
      const amp = r2((kind === "grass" ? 3 : 4.5) + rnd() * 3);
      const dur = r2(3.8 + rnd() * 1.6);
      if (kind === "stalk") {
        const cx = x + lean * 0.2;
        const d = `M${x} ${FIELD_H} Q${r2(cx)} ${r2(FIELD_H - height * 0.55)} ${r2(topX)} ${r2(topY)}`;
        const angle = r2((Math.atan2(lean, height) * 180) / Math.PI);
        const scale = r2((layer === 0 ? 0.62 : 0.9) + rnd() * 0.2);
        out.push({ kind, layer, x, d, ear: `translate(${r2(topX)} ${r2(topY)}) rotate(${angle}) scale(${scale})`, delay, amp, dur });
      } else {
        const w = 3 + rnd() * 3.5;
        const d = `M${r2(x - w / 2)} ${FIELD_H} Q${r2(x + lean * 0.2)} ${r2(FIELD_H - height * 0.6)} ${r2(topX)} ${r2(topY)} Q${r2(x + lean * 0.35 + w * 0.3)} ${r2(FIELD_H - height * 0.5)} ${r2(x + w / 2)} ${FIELD_H} Z`;
        out.push({ kind, layer, x, d, delay, amp, dur });
      }
    }
  }
  return out;
}

const BLADES = buildField();

/**
 * Trigal del pie de página: espigas y pasto que se mecen con una ola de viento.
 * Al pasar el dedo o el puntero sopla una ráfaga. Fuera de pantalla se pausa.
 */
export function WheatField() {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  const gustTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(gustTimer.current), []);

  // La ráfaga se maneja con una clase (sin re-render): así no se reinicia el vaivén de fondo.
  function blow() {
    const el = ref.current;
    if (!el || gustTimer.current) return;
    el.classList.add("gusting");
    gustTimer.current = window.setTimeout(() => {
      el.classList.remove("gusting");
      gustTimer.current = undefined;
    }, 2400);
  }

  return (
    <svg
      ref={ref}
      className="wheat-field"
      data-run={visible ? "" : undefined}
      viewBox={`0 ${-FIELD_TOP} ${FIELD_W} ${FIELD_H + FIELD_TOP}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      onPointerEnter={blow}
      onPointerDown={blow}
    >
      <defs>
        <g id={`${id}-ear`}>
          {[-4, -10, -16, -22, -28].map((y) => (
            <g key={y}>
              <ellipse cx="-2.3" cy={y} rx="2.2" ry="4.4" transform={`rotate(-26 -2.3 ${y})`} />
              <ellipse cx="2.3" cy={y} rx="2.2" ry="4.4" transform={`rotate(26 2.3 ${y})`} />
            </g>
          ))}
          <ellipse cx="0" cy="-34" rx="1.9" ry="4.2" />
          <path d="M-3 -26 L-7 -44 M3 -26 L7 -44 M0 -38 L0 -50" className="awn" />
        </g>
      </defs>
      <path className="hill back" d={`M0 ${FIELD_H} V118 C200 92 380 112 600 104 C820 96 1000 82 1200 106 V${FIELD_H} Z`} />
      <path className="hill front" d={`M0 ${FIELD_H} V148 C260 132 520 150 760 140 C960 132 1080 138 1200 146 V${FIELD_H} Z`} />
      <g>
        {BLADES.map((b, i) => (
          <g
            key={i}
            className={`blade l${b.layer}`}
            style={{ "--delay": `${b.delay}s`, "--amp": `${b.amp}deg`, "--dur": `${b.dur}s`, "--gd": `${r2((b.x / FIELD_W) * 0.7)}s` } as React.CSSProperties}
          >
            <g className="gust">
              {b.kind === "stalk" ? (
                <>
                  <path className="stem" d={b.d} />
                  <use href={`#${id}-ear`} transform={b.ear} className="ear" />
                </>
              ) : (
                <path className="grass" d={b.d} />
              )}
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Foto de perfil (o iniciales) dentro de una corona de espigas. */
export function MemberAvatar({ name, src, size = "md" }: { name: string; src: string | null; size?: "sm" | "md" | "lg" }) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "BC";
  return (
    <span className={`mav mav-${size}`}>
      <span className="mav-ring" aria-hidden="true" />
      <span className="mav-core">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL (demo) u origen del backend
          <img src={src} alt="" draggable={false} />
        ) : (
          <span className="mav-ini">{initials}</span>
        )}
      </span>
    </span>
  );
}
