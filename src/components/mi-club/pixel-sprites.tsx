"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Pixel art 8-bit del área de socios: cocineros, horno, olla, moto de delivery,
 * local y casa. Cada sprite es una cuadrícula de caracteres (un carácter = un
 * píxel) que se compila una sola vez a rectángulos SVG: pesa casi nada, se ve
 * nítido a cualquier escala y no necesita imágenes. Los sprites de dos cuadros
 * alternan con CSS `steps(1)` y solo corren con `[data-run]` en un ancestro
 * (visible en pantalla y sin `prefers-reduced-motion`).
 */

const PALETTE: Record<string, string> = {
  k: "#2a1508", // contorno
  K: "#1b0e07", // boca del horno
  w: "#fff8ec", // filipina y gorro
  g: "#d9cbb5", // gris claro
  s: "#e8b48a", // piel
  S: "#c98d63", // piel sombra
  r: "#d4472a", // pañuelo, casco, toldo
  p: "#3b3a4a", // pantalón
  o: "#d98c3c", // corteza
  O: "#a4502a", // corteza oscura / techo
  y: "#f3c873", // miga, luz, estrellas
  f: "#ff8a3d", // fuego
  F: "#ffd36b", // fuego vivo
  B: "#a4502a", // ladrillo
  J: "#6e2f15", // junta de ladrillo
  m: "#b9bcc4", // metal claro
  M: "#5d606a", // metal
};

const CHEF_HEAD = [
  "....kkkkkk....",
  "...kwwwwwwk...",
  "..kwwwwwwwwk..",
  "..kwwwwwwwwk..",
  "...kwwwwwwk...",
  "...kggggggk...",
  "...kssssssk...",
  "...kskssksk...",
  "...kssssssk...",
  "....kSSSSk....",
  "...krrrrrrk...",
];
const CHEF_LEGS = ["..kwwwkwwwwk..", "..kppppppppk..", "..kppk..kppk..", "..kkkk..kkkk.."];

const OVEN_TOP = [
  "......kkkkkkkkkk......",
  "....kkBBBBJBBBBBkk....",
  "...kBBBJBBBBBJBBBBk...",
  "..kBBBBBBBJBBBBBBBBk..",
  ".kBBJBBkkkkkkkkBBJBBk.",
  ".kBBBBkKKKKKKKKkBBBBk.",
  "kBBBBkKKKKKKKKKKkBBBBk",
  "kBJBBkKKKooooKKKkBBJBk",
];
const OVEN_BASE = [
  "kBBBBkkkkkkkkkkkkBBBBk",
  "kJJJJJJJJJJJJJJJJJJJJk",
  "kBBBBBJBBBBBJBBBBBJBBk",
  "kJJJJJJJJJJJJJJJJJJJJk",
  "kkkkkkkkkkkkkkkkkkkkkk",
];

const MOTO_TOP = [
  "........kkkk........",
  ".......krrrrk.......",
  ".......krrkkk.......",
  ".......krrkwk.......",
  "..kkkk.kkssk........",
  ".kooook.krrrk.......",
  ".koyyok.krrrrk......",
  ".kooook..krrkk..k...",
  ".kkkkkkkkkkkkkkkMk..",
];

const RAW = {
  chef: [
    [...CHEF_HEAD, "..kwwwrrwwwk..", ".kwwwwkwwwwwk.", ".kwwwwwwwwwwk.", "kskwwwkwwwwksk", "kskwwwwwwwwksk", ...CHEF_LEGS],
    [...CHEF_HEAD, "..kwwwrrwwwkMk", ".kwwwwkwwwwkMk", ".kwwwwwwwwksk.", "kskwwwkwwwwk..", "kskwwwwwwwwk..", ...CHEF_LEGS],
  ],
  oven: [
    [...OVEN_TOP, "kBBBBkKKoyyyyoKKkBBBBk", "kBBBBkKfoooooofFkBBBBk", "kBBJBkfFfFffFfFfkBJBBk", ...OVEN_BASE],
    [...OVEN_TOP, "kBBBBkKfoyyyyoKKkBBBBk", "kBBBBkKFooooooKfkBBBBk", "kBBJBkFfFfFFfFfFkBJBBk", ...OVEN_BASE],
  ],
  pot: [
    [".kkkkkkkkkk.", "kMmmmmmmmmMk", "kMMMMMMMMMMk", ".kMMMMMMMMk.", ".kMMMMMMMMk.", "..kkkkkkkk..", "..fFf..fFf..", ".kMMMMMMMMk."],
    [".kkkkkkkkkk.", "kMmmmmmmmmMk", "kMMMMMMMMMMk", ".kMMMMMMMMk.", ".kMMMMMMMMk.", "..kkkkkkkk..", "..FfF..FfF..", ".kMMMMMMMMk."],
  ],
  moto: [
    [...MOTO_TOP, "..kMMMMMMMMMMMMMMk..", ".kkk..........kkk...", "kMgMk........kMgMk..", "kgkgk........kgkgk..", ".kkk..........kkk..."],
    [...MOTO_TOP, "g.kMMMMMMMMMMMMMMk..", ".kkk..........kkk...", "kgMgk........kgMgk..", "kMkMk........kMkMk..", ".kkk..........kkk..."],
  ],
  house: [
    [
      "........kk........",
      "......kkOOkk......",
      "....kkOOOOOOkk....",
      "..kkOOOOOOOOOOkk..",
      "kkOOOOOOOOOOOOOOkk",
      "kkkkkkkkkkkkkkkkkk",
      ".kwwwwwwwwwwwwwwk.",
      ".kwkkkwwwwwwkkkwk.",
      ".kwkykwwkkwwkykwk.",
      ".kwkkkwkoykwkkkwk.",
      ".kwwwwwkookwwwwwk.",
      ".kwwwwwkookwwwwwk.",
      "kkkkkkkkkkkkkkkkkk",
    ],
  ],
  shop: [
    [
      "kkkkkkkkkkkkkkkkkk",
      "kBBBBBBBBBBBBBBBBk",
      "kBBkyyyyyyyyyykBBk",
      "kkkkkkkkkkkkkkkkkk",
      "krwrwrwrwrwrwrwrwk",
      ".krwrwrwrwrwrwrwk.",
      ".kwwwwwwwwwwwwwwk.",
      ".kwkkkkkwkkkkkkwk.",
      ".kwkoyokwkKKKKkwk.",
      ".kwkkkkkwkKKKKkwk.",
      ".kwwwwwwwkKKKKkwk.",
      "kkkkkkkkkkkkkkkkkk",
    ],
  ],
  tray: [[".kkk..kkk.", "kooOkkooOk", "MMMMMMMMMM"]],
  ticket: [["kkkkkkkk", "kwwwwwwk", "kwkkkkwk", "kwwwwwwk", "kwkkkwwk", "kwwwwwwk", "kwkkkkwk", "kwwwwwwk", "kwkwkwkk"]],
  bread: [["..kk..", ".kook.", "koyyok", "kkkkkk"]],
  star: [["...k...", "..kyk..", "kkyyykk", ".kyyyk.", "..kyk..", ".kykyk.", ".k...k."]],
} satisfies Record<string, string[][]>;

export type SpriteName = keyof typeof RAW;

type Run = { x: number; y: number; w: number; fill: string };

/** Une los píxeles iguales de cada fila en un solo rectángulo. */
function compile(grid: string[]): Run[] {
  const runs: Run[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const fill = PALETTE[ch];
      if (fill) runs.push({ x, y, w: end - x, fill });
      x = end;
    }
  });
  return runs;
}

const SPRITES = Object.fromEntries(
  Object.entries(RAW).map(([name, frames]) => [name, { w: frames[0][0].length, h: frames[0].length, frames: frames.map(compile) }]),
) as Record<SpriteName, { w: number; h: number; frames: Run[][] }>;

/** Un sprite 8-bit. `scale` es el tamaño en px de cada píxel. Con dos cuadros, alterna cada `fps` segundos. */
export function Pixel({
  sprite,
  scale = 3,
  flip = false,
  fps,
  className = "",
  style,
}: {
  sprite: SpriteName;
  scale?: number;
  flip?: boolean;
  fps?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { w, h, frames } = SPRITES[sprite];
  return (
    <svg
      className={`px px-${sprite}${flip ? " px-flip" : ""} ${className}`}
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      style={fps ? ({ ...style, "--px-fps": `${fps}s` } as React.CSSProperties) : style}
    >
      {frames.map((runs, i) => (
        <g key={i} className={frames.length > 1 ? (i === 0 ? "px-a" : "px-b") : undefined}>
          {runs.map((r, j) => (
            <rect key={j} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** `true` mientras el elemento está en pantalla: las escenas se pausan fuera de vista. */
export function useInView<T extends Element>(margin = "80px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, inView] as const;
}
