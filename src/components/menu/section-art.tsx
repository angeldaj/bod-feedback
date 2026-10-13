"use client";

import { motion, type Variants } from "motion/react";
import { ParticleCanvas, type ParticleSystem } from "./particle-canvas";

/*
 * Ilustración de cada sección de la carta: un dibujo de líneas doradas que se
 * traza solo al entrar en pantalla, con un efecto vivo encima según la
 * categoría (vapor en lo caliente, burbujas en las bebidas, harina en la
 * panadería, destellos en los postres). El dibujo se elige por el nombre de
 * la sección; si no se reconoce, sale la campana de servicio.
 *
 * Coordenadas del dibujo: viewBox 120 × 120. El canvas de partículas cubre el
 * mismo ancho y se extiende 48 unidades hacia arriba (para que el vapor suba
 * por encima del plato): en unidades del dibujo va de y = -48 a y = 120.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const TOP = 48;
const SPAN = 120 + TOP;

const X = (x: number, w: number) => (x / 120) * w;
const Y = (y: number, h: number) => ((y + TOP) / SPAN) * h;

/** Círculo como trazo (para que también se dibuje con `pathLength`). */
function circle(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

// ─── Dibujos ────────────────────────────────────────────────────────────────

type Art = {
  /** Trazos en el orden en que se dibujan. */
  paths: string[];
  effect: ParticleSystem<never> | null;
};

const PANINI = [
  "M18 58 C18 47 26 42 36 42 H84 C94 42 102 47 102 58 Z",
  "M38 46 L46 55 M54 46 L62 55 M70 46 L78 55",
  "M15 64 C24 59 32 68 42 63 S58 58 66 63 S84 68 92 63 S100 61 105 63",
  "M20 70 H100 C100 79 94 84 85 84 H35 C26 84 20 79 20 70 Z",
  "M46 66 v7 a3 3 0 0 0 6 0 v-5",
];

const BURGER = [
  "M22 56 C22 38 40 29 60 29 C80 29 98 38 98 56 Z",
  "M44 41 l4 -2 M58 37 h5 M72 41 l4 2 M51 47 l3 -1 M66 47 l3 1",
  "M17 62 C25 57 31 66 39 61 S53 56 60 61 S74 66 81 61 S95 57 103 62",
  "M24 67 H96 a5 5 0 0 1 0 10 H24 a5 5 0 0 1 0 -10 Z",
  "M24 83 H96 C96 91 90 95 82 95 H38 C30 95 24 91 24 83 Z",
];

const BREAKFAST = [
  "M28 54 A32 32 0 0 1 92 54",
  "M60 14 v-6 M34 24 l-4 -4 M86 24 l4 -4 M22 44 h-6 M98 44 h6",
  "M38 58 H82 V74 C82 86 74 93 60 93 C46 93 38 86 38 74 Z",
  "M82 62 C94 62 94 79 82 79",
  "M24 98 C38 105 82 105 96 98",
];

const PIZZA = [
  "M60 100 L27 31 L93 31 Z",
  "M27 31 C46 22 74 22 93 31",
  "M33 41 C50 33 70 33 87 41",
  circle(52, 52, 5),
  circle(68, 60, 4.5),
  circle(58, 78, 3.5),
  "M74 50 v9 a2.5 2.5 0 0 0 5 0 v-4",
];

const MEAL = [
  circle(60, 64, 28),
  circle(60, 64, 19),
  "M18 34 V92 M13 34 V49 C13 54 23 54 23 49 V34",
  "M102 34 C95 43 95 58 102 63 V92",
];

const DRINK = [
  "M40 28 H80 L73 98 H47 Z",
  "M42 50 C50 46 56 54 63 50 S73 46 78 50",
  "M64 50 L73 18 H82",
  circle(82, 31, 9),
  "M82 22 V40 M73 31 H91",
];

const DESSERT = [
  "M34 64 C29 52 43 46 49 49 C51 38 69 38 71 49 C78 46 91 52 86 64 Z",
  "M37 64 H83 L76 96 H44 Z",
  "M50 64 L52 96 M60 64 V96 M70 64 L68 96",
  circle(60, 35, 5),
  "M60 30 C60 24 64 20 68 19",
];

const PASTA = [
  "M20 62 H100 C100 82 83 95 60 95 C37 95 20 82 20 62 Z",
  "M32 62 C34 48 46 54 48 44 C50 54 62 46 64 56 C66 46 80 50 86 62",
  "M44 58 C48 50 56 52 54 60 M62 58 C64 50 72 50 72 58",
  "M90 22 L74 58 M86 20 L72 50 M94 24 L78 60",
];

const SALAD = [
  "M20 64 H100 C100 83 83 95 60 95 C37 95 20 83 20 64 Z",
  "M30 64 C30 46 44 40 52 48 C52 60 44 64 30 64 Z",
  "M52 64 C54 42 70 34 76 44 C78 58 66 64 52 64 Z",
  "M74 64 C78 50 92 48 94 58 C90 64 82 64 74 64 Z",
  circle(46, 58, 4),
  circle(84, 60, 3),
];

const BOARD = [
  "M12 74 H94 a6 6 0 0 1 0 12 H12 a6 6 0 0 1 0 -12 Z",
  "M100 80 H110",
  "M22 74 V58 L54 48 V74 Z",
  "M22 58 L38 50 L54 48",
  circle(33, 65, 2.5),
  circle(45, 60, 2),
  circle(68, 67, 5.5),
  circle(80, 67, 5.5),
  circle(74, 57, 5.5),
  "M74 51 C75 46 79 43 84 43",
];

const BREAD = [
  "M14 74 C24 44 50 34 60 34 C70 34 96 44 106 74 C92 66 76 64 60 64 C44 64 28 66 14 74 Z",
  "M36 50 C40 58 42 62 42 64 M60 36 V64 M84 50 C80 58 78 62 78 64",
  "M24 86 H96",
];

const CLOCHE = [
  "M22 84 H98",
  "M30 80 C30 58 44 45 60 45 C76 45 90 58 90 80 Z",
  circle(60, 40, 4),
  "M44 60 C48 54 54 52 58 52",
  "M18 92 H102",
];

// ─── Efectos ────────────────────────────────────────────────────────────────

type Puff = { x: number; y: number; r: number; speed: number; sway: number; phase: number; age: number; life: number };

/** Vapor: nubecitas color crema que suben, se abren y se disipan. */
function steam(x0: number, x1: number, y0: number): ParticleSystem<Puff> {
  return {
    count: 9,
    spawn: (_w, _h, initial) => {
      const life = 2.6 + Math.random() * 1.6;
      return {
        x: x0 + Math.random() * (x1 - x0),
        y: y0,
        r: 5 + Math.random() * 4,
        speed: 10 + Math.random() * 8,
        sway: 3 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
        age: initial ? Math.random() * life : 0,
        life,
      };
    },
    step: (p, dt) => {
      p.age += dt;
      p.phase += dt * 1.6;
      return p.age < p.life;
    },
    draw: (ctx, p, w, h) => {
      const t = p.age / p.life;
      const r = ((p.r + t * 12) / 120) * w;
      const alpha = Math.sin(Math.PI * t) * 0.11;
      const x = X(p.x + Math.sin(p.phase) * p.sway * t, w);
      const y = Y(p.y - p.speed * p.age, h);
      // Borde difuminado: se ve como vapor y no como una bolita.
      const puff = ctx.createRadialGradient(x, y, 0, x, y, r);
      puff.addColorStop(0, `rgba(247, 242, 231, ${alpha})`);
      puff.addColorStop(1, "rgba(247, 242, 231, 0)");
      ctx.beginPath();
      ctx.shadowBlur = 0;
      ctx.fillStyle = puff;
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}

type Bubble = { x: number; y: number; r: number; speed: number; phase: number };

/** Burbujas que suben dentro del vaso y revientan en la superficie. */
function bubbles(x0: number, x1: number, bottom: number, top: number): ParticleSystem<Bubble> {
  return {
    count: 8,
    spawn: (_w, _h, initial) => ({
      x: x0 + Math.random() * (x1 - x0),
      y: initial ? top + Math.random() * (bottom - top) : bottom,
      r: 0.8 + Math.random() * 1.4,
      speed: 7 + Math.random() * 10,
      phase: Math.random() * Math.PI * 2,
    }),
    step: (p, dt) => {
      p.y -= p.speed * dt;
      p.phase += dt * 4;
      return p.y > top;
    },
    draw: (ctx, p, w, h) => {
      ctx.beginPath();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(247, 242, 231, 0.55)";
      ctx.lineWidth = Math.max(0.6, (0.7 / 120) * w);
      ctx.arc(X(p.x + Math.sin(p.phase) * 0.8, w), Y(p.y, h), (p.r / 120) * w, 0, Math.PI * 2);
      ctx.stroke();
    },
  };
}

type Speck = { x: number; y: number; r: number; speed: number; drift: number; phase: number };

/** Harina que cae despacio, como al enharinar la mesa. */
const FLOUR: ParticleSystem<Speck> = {
  count: 22,
  spawn: (_w, _h, initial) => ({
    x: Math.random() * 120,
    y: initial ? -TOP + Math.random() * SPAN : -TOP - Math.random() * 10,
    r: 0.4 + Math.random() * 0.8,
    speed: 5 + Math.random() * 8,
    drift: 2 + Math.random() * 4,
    phase: Math.random() * Math.PI * 2,
  }),
  step: (p, dt) => {
    p.y += p.speed * dt;
    p.phase += dt;
    return p.y < 120;
  },
  draw: (ctx, p, w, h) => {
    ctx.beginPath();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(247, 242, 231, 0.4)";
    ctx.arc(X(p.x + Math.sin(p.phase) * p.drift, w), Y(p.y, h), (p.r / 120) * w, 0, Math.PI * 2);
    ctx.fill();
  },
};

type Glint = { x: number; y: number; size: number; age: number; life: number; turn: number };

/** Destellos dorados de cuatro puntas que aparecen y se apagan. */
const SPARKLE: ParticleSystem<Glint> = {
  count: 9,
  spawn: (_w, _h, initial) => {
    const life = 1.2 + Math.random() * 1.4;
    return {
      x: 12 + Math.random() * 96,
      y: -30 + Math.random() * 130,
      size: 1.6 + Math.random() * 2,
      age: initial ? Math.random() * life : 0,
      life,
      turn: Math.random() * Math.PI,
    };
  },
  step: (p, dt) => {
    p.age += dt;
    return p.age < p.life;
  },
  draw: (ctx, p, w, h) => {
    const t = p.age / p.life;
    const alpha = Math.sin(Math.PI * t) * 0.85;
    const s = (p.size / 120) * w;
    ctx.save();
    ctx.translate(X(p.x, w), Y(p.y, h));
    ctx.rotate(p.turn + t * 0.8);
    ctx.beginPath();
    ctx.fillStyle = `rgba(239, 199, 126, ${alpha})`;
    ctx.shadowColor = `rgba(239, 199, 126, ${alpha})`;
    ctx.shadowBlur = s * 3;
    ctx.moveTo(0, -s * 2);
    ctx.quadraticCurveTo(0, 0, s * 2, 0);
    ctx.quadraticCurveTo(0, 0, 0, s * 2);
    ctx.quadraticCurveTo(0, 0, -s * 2, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s * 2);
    ctx.fill();
    ctx.restore();
  },
};

// Cada vapor sale justo encima de su comida.
const STEAM_PANINI = steam(44, 76, 38);
const STEAM_BURGER = steam(46, 74, 26);
const STEAM_PIZZA = steam(48, 72, 22);
const STEAM_CUP = steam(50, 70, 54);
const STEAM_PLATE = steam(48, 72, 56);
const STEAM_BOWL = steam(42, 78, 44);
const DRINK_BUBBLES = bubbles(50, 70, 94, 52);

// Los sistemas de partículas guardan su propio tipo; aquí da igual cuál.
const effect = <P,>(system: ParticleSystem<P>) => system as unknown as ParticleSystem<never>;

const ARTS = {
  panini: { paths: PANINI, effect: effect(STEAM_PANINI) },
  burger: { paths: BURGER, effect: effect(STEAM_BURGER) },
  breakfast: { paths: BREAKFAST, effect: effect(STEAM_CUP) },
  pizza: { paths: PIZZA, effect: effect(STEAM_PIZZA) },
  meal: { paths: MEAL, effect: effect(STEAM_PLATE) },
  drink: { paths: DRINK, effect: effect(DRINK_BUBBLES) },
  dessert: { paths: DESSERT, effect: effect(SPARKLE) },
  pasta: { paths: PASTA, effect: effect(STEAM_BOWL) },
  salad: { paths: SALAD, effect: null },
  board: { paths: BOARD, effect: effect(SPARKLE) },
  bread: { paths: BREAD, effect: effect(FLOUR) },
  cloche: { paths: CLOCHE, effect: effect(SPARKLE) },
} satisfies Record<string, Art>;

export type ArtKind = keyof typeof ARTS;

/** Palabras del nombre de la sección → dibujo. La primera que coincide gana. */
const KEYWORDS: [RegExp, ArtKind][] = [
  [/panini|sandwich|sanduche|tostad|wrap/, "panini"],
  [/hamburgues|burger/, "burger"],
  [/desayun|cafe|arepa|empanad/, "breakfast"],
  [/pizza/, "pizza"],
  [/pasta|linguin|spaghett|lasa/, "pasta"],
  [/ensalad|bowl|vegetarian/, "salad"],
  [/bebida|jugo|batido|merengada|limonada|refresco|trago|coctel|cerveza|vino/, "drink"],
  [/postre|dulce|torta|helado|reposter/, "dessert"],
  [/tabla|entrada|picar|tapa|compartir|aperitiv/, "board"],
  [/pan\b|panaderia|bolleria|hojaldre|cachito|croissant/, "bread"],
  [/comida|almuerzo|plato|principal|fuerte|carne|parrilla|pollo|pescado|marisco|criolla|sopa|crema/, "meal"],
];

export function artKindFor(name: string): ArtKind {
  const clean = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  return KEYWORDS.find(([pattern]) => pattern.test(clean))?.[1] ?? "cloche";
}

const drawing: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.1 } },
};
const stroke: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 1.3, ease: EASE }, opacity: { duration: 0.2 } },
  },
};

/**
 * Dibujo de la sección con su efecto. Se dibuja una sola vez al aparecer;
 * después flota apenas y el efecto sigue vivo mientras se vea.
 */
export function SectionArt({ name, className = "" }: { name: string; className?: string }) {
  const art: Art = ARTS[artKindFor(name)];
  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      <motion.svg
        viewBox="0 0 120 120"
        fill="none"
        variants={drawing}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.6 }}
        className="menu-art-float relative size-full overflow-visible text-gold-accent"
      >
        {art.paths.map((d, index) => (
          <motion.path
            key={index}
            d={d}
            variants={stroke}
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </motion.svg>
      {art.effect && (
        <ParticleCanvas system={art.effect} className="absolute inset-x-0 bottom-0 block h-[140%] w-full" />
      )}
    </div>
  );
}
