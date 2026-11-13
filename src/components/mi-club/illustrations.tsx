import type { ReactNode, SVGProps } from "react";

/*
 * Dibujos de premio (64×64, trazo de tinta café y colores planos de horno).
 * Reemplazan a los íconos de trazo en la ruleta y el raspadito. Sin
 * gradientes ni ids: se pueden repetir en la misma página sin choques.
 */

const INK = "#2a1a11";
const line = { stroke: INK, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ART: Record<string, ReactNode> = {
  coin: (
    <>
      <ellipse cx="32" cy="46" rx="20" ry="7" fill="#c98f2a" {...line} />
      <path d="M12 40v6c0 4 9 7 20 7s20-3 20-7v-6" fill="#c98f2a" {...line} />
      <ellipse cx="32" cy="40" rx="20" ry="7" fill="#e7b53f" {...line} />
      <path d="M12 30v10c0 4 9 7 20 7s20-3 20-7V30" fill="#d9a032" {...line} />
      <ellipse cx="32" cy="30" rx="20" ry="7" fill="#f6cf6a" {...line} />
      <path d="M26 30h12M32 27v6" {...line} stroke="#8a5a12" />
      <circle className="art-glint" cx="47" cy="17" r="2.6" fill="#fffaf2" />
      <path className="art-glint" d="M47 9v4M47 21v4M39 17h4M51 17h4" stroke="#fffaf2" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  coffee: (
    <>
      <g className="art-steam" fill="none" stroke="#b88a6a" strokeWidth="2.4" strokeLinecap="round">
        <path d="M24 18c-3-4 3-6 0-10" />
        <path d="M32 18c-3-4 3-6 0-10" />
        <path d="M40 18c-3-4 3-6 0-10" />
      </g>
      <ellipse cx="32" cy="54" rx="22" ry="4.5" fill="#efe3d0" {...line} />
      <path d="M46 29h3a7 7 0 0 1 0 14h-4" fill="none" {...line} />
      <path d="M15 24h34l-3 22a6 6 0 0 1-6 5H24a6 6 0 0 1-6-5Z" fill="#fff0d6" {...line} />
      <ellipse cx="32" cy="24" rx="17" ry="3.4" fill="#6f4428" {...line} />
      <path d="M20 34h24" stroke="#e2492a" strokeWidth="3.2" strokeLinecap="round" />
    </>
  ),
  percent: (
    <>
      <path d="M10 30 30 10h20a4 4 0 0 1 4 4v20L34 54a4 4 0 0 1-6 0L10 36a4 4 0 0 1 0-6Z" fill="#e2492a" {...line} />
      <circle cx="45" cy="19" r="3.4" fill="#fffaf2" {...line} />
      <path d="M24 40 38 26" stroke="#fff1e4" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="25" cy="28" r="3.6" fill="none" stroke="#fff1e4" strokeWidth="3" />
      <circle cx="37" cy="38" r="3.6" fill="none" stroke="#fff1e4" strokeWidth="3" />
    </>
  ),
  star: (
    <>
      <path d="M32 7l7.4 15 16.6 2.4-12 11.7 2.8 16.5L32 44.8l-14.8 7.8 2.8-16.5-12-11.7L24.6 22Z" fill="#f6cf6a" {...line} />
      <path d="M26 30c2 2 10 2 12 0" fill="none" {...line} />
      <circle cx="26" cy="25" r="1.8" fill={INK} />
      <circle cx="38" cy="25" r="1.8" fill={INK} />
      <path className="art-glint" d="M54 6v6M51 9h6M10 46v5M7.5 48.5h5" stroke="#e2492a" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  croissant: (
    <>
      <path d="M8 40c-2-8 4-16 10-17l6 21c-7 2-14 2-16-4Z" fill="#c8955a" {...line} />
      <path d="M56 40c2-8-4-16-10-17l-6 21c7 2 14 2 16-4Z" fill="#c8955a" {...line} />
      <path d="M18 23c2-5 7-8 10-8l4 29h-8Z" fill="#e3a92f" {...line} />
      <path d="M46 23c-2-5-7-8-10-8l-4 29h8Z" fill="#e3a92f" {...line} />
      <path d="M28 15c2-2 6-2 8 0l2 29H26Z" fill="#f6cf6a" {...line} />
      <path d="M29 22h6M28.5 30h7M28 37h8" stroke="#a8691e" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  cake: (
    <>
      <path d="M10 34 46 20l8 6v24H10Z" fill="#fff0d6" {...line} />
      <path d="M10 34 46 20l8 6-44 8Z" fill="#c73a63" {...line} />
      <path d="M10 42h44" stroke="#c73a63" strokeWidth="4" />
      <path d="M10 34v16h44V26" fill="none" {...line} />
      <path d="M14 34c2 3 4 3 6 0s4-3 6 0 4 3 6 0 4-3 6 0" fill="none" stroke="#fffaf2" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="44" cy="15" r="5" fill="#e2492a" {...line} />
      <path d="M44 10c1-3 4-5 7-5" fill="none" {...line} />
    </>
  ),
  juice: (
    <>
      <path d="M38 6l-6 18" {...line} stroke="#c73a63" strokeWidth="3.4" />
      <path d="M16 20h32l-4 32a4 4 0 0 1-4 3.5H24a4 4 0 0 1-4-3.5Z" fill="#fff0d6" {...line} />
      <path d="M18.4 30h27.2l-2.7 21.6a3 3 0 0 1-3 2.4H24.1a3 3 0 0 1-3-2.4Z" fill="#ff8c42" />
      <circle className="art-bubble" cx="28" cy="44" r="2" fill="#ffd2a8" />
      <circle className="art-bubble b2" cx="36" cy="38" r="1.6" fill="#ffd2a8" />
      <circle cx="48" cy="20" r="9" fill="#f6cf6a" {...line} />
      <path d="M48 11v18M39 20h18M41.6 13.6l12.8 12.8M54.4 13.6 41.6 26.4" stroke="#e3a92f" strokeWidth="1.6" />
      <path d="M16 20h32l-4 32a4 4 0 0 1-4 3.5H24a4 4 0 0 1-4-3.5Z" fill="none" {...line} />
    </>
  ),
  ticket: (
    <>
      <path d="M8 20a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v6a6 6 0 0 0 0 12v6a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4v-6a6 6 0 0 0 0-12Z" fill="#f6cf6a" {...line} />
      <path d="M42 18v28" stroke="#c98f2a" strokeWidth="2.4" strokeDasharray="3 4" />
      <path d="M17 26h18M17 33h14" stroke="#8a5a12" strokeWidth="3" strokeLinecap="round" />
      <path d="M17 40h9" stroke="#e2492a" strokeWidth="3" strokeLinecap="round" />
      <path className="art-glint" d="M50 6v6M47 9h6" stroke="#e2492a" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  "ticket-x": (
    <>
      <path d="M8 22a4 4 0 0 1 4-4h16l-3 7 4 6-4 7 3 8H12a4 4 0 0 1-4-4v-5a6 6 0 0 0 0-11Z" fill="#efe3d0" {...line} transform="rotate(-8 20 32)" />
      <path d="M36 18h16a4 4 0 0 1 4 4v4a6 6 0 0 0 0 11v5a4 4 0 0 1-4 4H36l-3-8 4-7-4-6Z" fill="#efe3d0" {...line} transform="rotate(8 46 32)" />
      <path d="M14 28h8M14 34h6M42 28h8M44 34h6" stroke="#a08a72" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  pan: (
    <>
      <path d="M8 26c0-6 5-10 12-10h28v34H20c-7 0-12-4-12-10Z" fill="#c8812f" {...line} />
      <path d="M12 24c2-3 5-4 9-4h25" fill="none" stroke="#f0b65a" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 22l6 26M28 18l6 32M38 18l5 32" stroke="#8a4f17" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="48" cy="33" rx="11" ry="17" fill="#fff0d6" {...line} />
      <path d="M48 33c0-2 3-2 3 1s-4 6-7 3-1-10 5-11 10 6 7 12-9 9-13 6" fill="none" stroke="#e8798f" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="25" r="1.8" fill="#4f6b2a" />
      <circle cx="53" cy="42" r="1.8" fill="#4f6b2a" />
      <circle cx="42" cy="40" r="1.6" fill="#5a2f1a" />
      <circle cx="54" cy="27" r="1.6" fill="#5a2f1a" />
    </>
  ),
  cash: (
    <>
      <rect x="10" y="22" width="46" height="28" rx="4" fill="#7fa65a" {...line} transform="rotate(-8 33 36)" />
      <rect x="8" y="18" width="46" height="28" rx="4" fill="#a7c97f" {...line} />
      <circle cx="31" cy="32" r="7" fill="#e8f2d6" {...line} />
      <path d="M31 28v8M28.6 30.4h3.6a1.6 1.6 0 0 1 0 3.2h-2.4a1.6 1.6 0 0 0 0 3.2H34" fill="none" stroke="#4f6b2a" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="25" r="2" fill="#4f6b2a" />
      <circle cx="47" cy="39" r="2" fill="#4f6b2a" />
    </>
  ),
  gift: (
    <>
      <path d="M32 20c-4-8-14-10-14-4s10 4 14 4c4 0 14 2 14-4s-10-4-14 4Z" fill="#f6cf6a" {...line} />
      <rect x="12" y="20" width="40" height="10" rx="2" fill="#e2492a" {...line} />
      <path d="M15 30h34v20a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3Z" fill="#c73a63" {...line} />
      <path d="M32 20v33" stroke="#f6cf6a" strokeWidth="5" />
      <path d="M32 20v33" fill="none" stroke={INK} strokeWidth="1.2" strokeOpacity="0.35" />
    </>
  ),
  plate: (
    <>
      <ellipse cx="32" cy="38" rx="26" ry="14" fill="#fffaf2" {...line} />
      <ellipse cx="32" cy="37" rx="17" ry="8.5" fill="#efe3d0" />
      <path d="M20 37c2-6 10-8 14-6" fill="#e3a92f" {...line} />
      <circle cx="38" cy="36" r="5" fill="#e2492a" {...line} />
      <path d="M26 40c3 2 9 2 14 0" fill="none" stroke="#4f6b2a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M8 14v12M8 20h3M56 12c-3 3-3 10 0 14v12" fill="none" {...line} />
    </>
  ),
  wheel: (
    <>
      <circle cx="32" cy="34" r="24" fill="#2a1a11" />
      <path d="M32 34V12a22 22 0 0 1 19 11Z" fill="#e2492a" />
      <path d="M32 34 51 23a22 22 0 0 1 0 22Z" fill="#fff0d6" />
      <path d="M32 34 51 45a22 22 0 0 1-19 11Z" fill="#e3a92f" />
      <path d="M32 34V56a22 22 0 0 1-19-11Z" fill="#c73a63" />
      <path d="M32 34 13 45a22 22 0 0 1 0-22Z" fill="#f6cf6a" />
      <path d="M32 34 13 23a22 22 0 0 1 19-11Z" fill="#6f4428" />
      <circle cx="32" cy="34" r="24" fill="none" {...line} />
      <circle cx="32" cy="34" r="5" fill="#fffaf2" {...line} />
      <path d="M32 2c-4 0-6 3-6 5 0 3 6 9 6 9s6-6 6-9c0-2-2-5-6-5Z" fill="#e2492a" {...line} />
    </>
  ),
};

/** Dibujo de un premio por su clave; una clave desconocida cae a la ruleta. */
export function Art({ kind, ...props }: { kind: string | null | undefined } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" {...props} className={`art${props.className ? ` ${props.className}` : ""}`}>
      {ART[kind ?? ""] ?? ART.wheel}
    </svg>
  );
}

const CATEGORY_ART: Record<string, string> = {
  Desayuno: "coffee",
  Bebidas: "juice",
  Panadería: "croissant",
  Postres: "cake",
  Almuerzo: "plate",
  Delivery: "gift",
  Efectivo: "cash",
};

/** Dibujo de una recompensa del club por su categoría. */
export const categoryArt = (category: string | null | undefined) => (category && CATEGORY_ART[category]) || "gift";
