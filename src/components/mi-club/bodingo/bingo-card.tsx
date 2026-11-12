"use client";

import { useId } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import {
  BINGO_LETTERS,
  cardColumns,
  letterOf,
  missingOf,
  type BodingoCard,
} from "@/lib/games-api";

const pad = (n: number) => String(n).padStart(4, "0");

/** Espiga de trigo (la misma del club, `public/club/panaderia/espiga.svg`). */
export function Espiga({ className }: { className?: string }) {
  const grain = (y: number) => (
    <g transform={`translate(0 ${y})`}>
      <ellipse
        cx="-4.4"
        cy="0"
        rx="3.6"
        ry="7.4"
        transform="rotate(-26 -4.4 0)"
      />
      <ellipse cx="4.4" cy="0" rx="3.6" ry="7.4" transform="rotate(26 4.4 0)" />
    </g>
  );
  return (
    <svg
      className={className}
      viewBox="-16 -40 32 82"
      aria-hidden="true"
      fill="currentColor"
    >
      <path
        d="M0 40 Q2 12 0 -20"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {grain(16)}
      {grain(5)}
      {grain(-6)}
      {grain(-17)}
      <ellipse cx="0" cy="-28" rx="3.2" ry="7.6" />
    </svg>
  );
}

/** Sello de la casa en la casilla libre. */
function Seal() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path
          id={`seal-${id}`}
          d="M50,50 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0"
        />
      </defs>
      <circle cx="50" cy="50" r="47" fill="#3A2116" />
      <circle
        cx="50"
        cy="50"
        r="43"
        fill="none"
        stroke="#F5E9D1"
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="50"
        r="27.5"
        fill="none"
        stroke="#F5E9D1"
        strokeWidth="1"
      />
      <text
        fontFamily="var(--font-game-num), 'Arial Narrow', sans-serif"
        fontWeight="800"
        fontSize="10"
        letterSpacing="1.6"
        fill="#F5E9D1"
      >
        <textPath href={`#seal-${id}`}>
          HORNEADO A DIARIO · LA BODEGA ·
        </textPath>
      </text>
      <image href="/logo-bodega.png" x="31" y="30" width="38" height="38" />
    </svg>
  );
}

/** Cartón kraft de bolsa de panadería: borde dentado, espigas y sellos de tinta. */
export function BingoCard({
  card,
  drawn,
  fresh = null,
  showNeed = false,
  mini = false,
  dateLabel,
}: {
  card: BodingoCard;
  drawn: Set<number>;
  /** Número recién cantado: su sello se estampa con animación. */
  fresh?: number | null;
  /** Marca la casilla que falta cuando queda una sola. */
  showNeed?: boolean;
  mini?: boolean;
  dateLabel: string;
}) {
  const missing = missingOf(card, drawn);
  const need = showNeed && missing.length === 1 ? missing[0] : null;
  const cols = cardColumns(card.numbers);
  return (
    <article
      className={`bdg-card${mini ? " mini" : ""}`}
      aria-label={`Cartón número ${pad(card.serial)}, ${missing.length ? `faltan ${missing.length}` : "lleno"}`}
    >
      <div className="bdg-paper">
        <div className="bdg-card-top">
          <Espiga className="bdg-esp" />
          <div className="bdg-card-title">
            <b>Bodingo</b>
            <small>Panadería La Bodega</small>
          </div>
          <Espiga className="bdg-esp flip" />
        </div>
        <div className="bdg-card-sub">
          <span>{dateLabel}</span>
          <span className="bdg-serial">Nº {pad(card.serial)}</span>
        </div>
        <div className="bdg-grid" role="grid">
          {BINGO_LETTERS.map((l) => (
            <div key={l} className="lt" aria-hidden="true">
              {l}
            </div>
          ))}
          {[0, 1, 2, 3, 4].flatMap((row) =>
            cols.map((col, ci) => {
              const n = col[row];
              if (!n) {
                return (
                  <div
                    key={`free-${ci}`}
                    className="c free"
                    role="gridcell"
                    aria-label="Casilla libre"
                  >
                    <Seal />
                  </div>
                );
              }
              const hit = drawn.has(n);
              const isNew = hit && n === fresh;
              return (
                <div
                  key={n}
                  className={`c${hit ? " hit" : ""}${isNew ? " press" : ""}${n === need ? " need" : ""}`}
                  role="gridcell"
                  aria-label={`${letterOf(n)} ${n}${hit ? ", marcado" : n === need ? ", te falta este" : ""}`}
                >
                  {hit ? (
                    <span
                      className={`dab${isNew ? " new" : ""}`}
                      style={
                        {
                          "--r": `${(n * 67) % 360}deg`,
                          "--m": `var(--stamp-${n % 4})`,
                        } as React.CSSProperties
                      }
                    />
                  ) : null}
                  <span className="n">{n}</span>
                </div>
              );
            }),
          )}
        </div>
        <div className="bdg-wave" aria-hidden="true" />
        <div className="bdg-card-foot">
          <span>Gana el cartón lleno</span>
          <span className="num">LB · BDG · {pad(card.serial)}</span>
        </div>
      </div>
    </article>
  );
}

function MiniMap({
  card,
  drawn,
  fresh,
}: {
  card: BodingoCard;
  drawn: Set<number>;
  fresh: number | null;
}) {
  const cols = cardColumns(card.numbers);
  return (
    <span className="bdg-mini" aria-hidden="true">
      {[0, 1, 2, 3, 4].flatMap((row) =>
        cols.map((col, ci) => {
          const n = col[row];
          return (
            <i
              key={`${row}-${ci}`}
              className={
                !n ? "f" : drawn.has(n) ? `h${n === fresh ? " new" : ""}` : ""
              }
            />
          );
        }),
      )}
    </span>
  );
}

export type DeckSelection = { kind: "card"; index: number } | { kind: "board" };

/** Los tres espacios de cartón: miniaturas con su mapa, espacios libres para comprar y el tablero en vivo. */
export function CardSlots({
  cards,
  drawn,
  fresh,
  selected,
  onSelect,
  live,
  freeSlots,
  price,
  canBuy,
  buying,
  onBuy,
  drawnCount,
}: {
  cards: BodingoCard[];
  drawn: Set<number>;
  fresh: number | null;
  selected: DeckSelection;
  onSelect: (s: DeckSelection) => void;
  live: boolean;
  freeSlots: number;
  price: number;
  canBuy: boolean;
  buying: boolean;
  onBuy: () => void;
  drawnCount: number;
}) {
  const count = cards.length + freeSlots + (live ? 1 : 0);
  return (
    <div
      className="bdg-slots"
      role="group"
      aria-label="Tus cartones"
      style={{ "--n": count } as React.CSSProperties}
    >
      {cards.map((card, i) => {
        const m = missingOf(card, drawn).length;
        const on = selected.kind === "card" && selected.index === i;
        const status = !live
          ? "Listo"
          : m === 0
            ? "¡Lleno!"
            : m === 1
              ? "¡Falta 1!"
              : `Faltan ${m}`;
        return (
          <button
            key={card.id}
            type="button"
            className={`bdg-slot${on ? " on" : ""}${live && m <= 1 ? " hot" : ""}`}
            aria-pressed={on}
            aria-label={`Cartón Nº ${pad(card.serial)}, ${status}`}
            onClick={() => onSelect({ kind: "card", index: i })}
          >
            <span className="slot-top">Nº {pad(card.serial)}</span>
            <MiniMap card={card} drawn={drawn} fresh={fresh} />
            <span className="slot-foot">{status}</span>
          </button>
        );
      })}
      {Array.from({ length: freeSlots }, (_, i) => (
        <button
          key={`free-${i}`}
          type="button"
          className="bdg-slot empty"
          disabled={!canBuy || buying}
          onClick={onBuy}
          aria-label={`Comprar otro cartón por ${price} puntos`}
        >
          <Plus aria-hidden="true" />
          <span className="slot-foot">Otro cartón</span>
          <span className="slot-sub num">{price} pts</span>
        </button>
      ))}
      {live ? (
        <button
          type="button"
          className={`bdg-slot board${selected.kind === "board" ? " on" : ""}`}
          aria-pressed={selected.kind === "board"}
          aria-label="Ver el tablero de bolas cantadas"
          onClick={() => onSelect({ kind: "board" })}
        >
          <LayoutGrid aria-hidden="true" />
          <span className="slot-foot">Tablero</span>
          <span className="slot-sub num">{drawnCount}/75</span>
        </button>
      ) : null}
    </div>
  );
}

/** Tablero de las 75 bolas; la última en coral. */
export function Board({
  drawn,
  last,
}: {
  drawn: Set<number>;
  last: number | null;
}) {
  return (
    <div className="bdg-board" aria-label="Tablero de bolas cantadas">
      {BINGO_LETTERS.map((l, ci) => (
        <div key={l} className="row">
          <span className="bl">{l}</span>
          {Array.from({ length: 15 }, (_, i) => {
            const n = ci * 15 + i + 1;
            return (
              <span
                key={n}
                className={n === last ? "last" : drawn.has(n) ? "on" : ""}
                aria-label={`${l}${n}${drawn.has(n) ? " cantada" : ""}`}
              >
                {n}
              </span>
            );
          })}
        </div>
      ))}
      <p className="cap">
        {drawn.size} de 75 bolas cantadas. La coral es la última.
      </p>
    </div>
  );
}
