"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Flame, SpellCheck2 } from "lucide-react";
import type { WordToday } from "@/lib/games-api";
import { useClub } from "../club-provider";
import { WordGame, type WordSource } from "../word/word-game";

/** Palabra del día dentro del club: juega como socio (puntos y racha). */
export function PalabraScreen() {
  const { games, reload, notify } = useClub();
  const source = useMemo<WordSource>(
    () => ({ kind: "member", api: games }),
    [games],
  );
  return (
    <div className="view pw-view">
      <WordGame
        source={source}
        onPointsChanged={() => void reload()}
        notify={(title, sub) => notify(SpellCheck2, title, sub)}
      />
    </div>
  );
}

/** Tarjeta de Inicio. Si el juego está apagado no aparece. */
export function PalabraTile() {
  const { games, href } = useClub();
  const [word, setWord] = useState<WordToday | null>(null);
  useEffect(() => {
    let alive = true;
    games
      .getWord()
      .then((w) => alive && setWord(w))
      .catch(() => alive && setWord(null));
    return () => {
      alive = false;
    };
  }, [games]);
  if (!word) return null;
  const status = word.finished
    ? word.solved
      ? `Resuelta en ${word.guesses.length}. Vuelve mañana.`
      : "Hoy no salió. Mañana hay otra."
    : word.guesses.length
      ? `Vas por el intento ${word.guesses.length + 1} de ${word.maxGuesses}.`
      : `Acierta y gana +${word.pointsPerWin} pts.`;
  return (
    <Link href={href("palabra")} className="tile pw-tile-home">
      <span className="pt-tiles" aria-hidden="true">
        {"PAN".split("").map((c, i) => (
          <i key={i} className={i === 0 ? "ok" : i === 1 ? "near" : ""}>
            {c}
          </i>
        ))}
      </span>
      <span className="pt-body">
        <b>Palabra del día #{word.number}</b>
        <small>{status}</small>
      </span>
      {word.streak.current ? (
        <span
          className="pt-streak"
          aria-label={`Racha de ${word.streak.current} días`}
        >
          <Flame aria-hidden="true" />
          {word.streak.current}
        </span>
      ) : (
        <ChevronRight aria-hidden="true" />
      )}
    </Link>
  );
}
