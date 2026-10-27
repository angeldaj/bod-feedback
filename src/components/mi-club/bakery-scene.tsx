"use client";

import { useEffect, useId, useRef } from "react";

/*
 * Escenografía del área de socios: la luz del fondo, el pan que se hornea en la
 * pantalla de carga y la foto de perfil. Lo decorativo es `aria-hidden`, anima
 * solo `transform`/`opacity` y se queda quieto con `prefers-reduced-motion`.
 */

/** Superficies que reflejan la luz del cursor (la tarjeta y la Wallet no: tienen su propio diseño). */
const LIT = ".tile, .rc, .list:not(.view-wallet .list)";

/**
 * Luz que sigue al cursor (solo con mouse): mueve el foco del fondo y deja en la
 * superficie bajo el puntero las coordenadas del reflejo (`--mx`, `--my`). Un solo
 * listener pasivo y un cuadro por animación; nada en estado de React.
 */
function usePointerLight(spot: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = spot.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const frame = () => {
      raf = 0;
      if (!last) return;
      const { clientX: x, clientY: y, target } = last;
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.style.opacity = "1";
      const lit = target instanceof Element ? target.closest<HTMLElement>(LIT) : null;
      if (lit) {
        const r = lit.getBoundingClientRect();
        lit.style.setProperty("--mx", `${x - r.left}px`);
        lit.style.setProperty("--my", `${y - r.top}px`);
      }
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      last = e;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const leave = () => (el.style.opacity = "0");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [spot]);
}

/** Fondo fijo: luces cálidas que derivan despacio, un grabado guilloché dorado, la luz del cursor y grano de papel. */
export function BakeryBackdrop() {
  const spot = useRef<HTMLElement>(null);
  usePointerLight(spot);
  return (
    <div className="bk-bg" aria-hidden="true">
      <div className="bk-aurora">
        <i className="a" />
        <i className="b" />
        <i className="c" />
      </div>
      {/* grabado guilloché (/club/guilloche.svg) como máscara: toma el dorado de cada tema */}
      <i className="bk-guilloche" />
      <i className="bk-spot" ref={spot} />
      <div className="bk-wash" />
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

/** Foto de perfil (o iniciales) con un aro dorado. */
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
