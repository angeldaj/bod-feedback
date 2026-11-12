"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import {
  CircleHelp,
  Coins,
  Delete,
  Flame,
  Share2,
  UserPlus,
} from "lucide-react";
import { ClubApiError } from "@/lib/club-api";
import {
  normalizeWord,
  publicGames,
  type GamesApi,
  type LetterResult,
  type WordBonus,
  type WordGuess,
} from "@/lib/games-api";
import { Espiga } from "../bodingo/bingo-card";

const ROWS = ["QWERTYUIOP", "ASDFGHJKLÑ", "⏎ZXCVBNM⌫"];
const NAMES: Record<LetterResult, string> = {
  ok: "en su lugar",
  near: "en otro lugar",
  miss: "no está",
};
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const FLIP_MS = 300;

/** Partida tal como se dibuja, venga del socio o del invitado. */
type Game = {
  date: string;
  number: number;
  hint: string | null;
  nextAt: string;
  maxGuesses: number;
  guesses: WordGuess[];
  solved: boolean;
  finished: boolean;
  answer: string | null;
  streak: { current: number; best: number } | null;
  pointsPerWin: number;
  bonuses: WordBonus[];
};

export type WordSource = { kind: "member"; api: GamesApi } | { kind: "guest" };

const guestKey = (date: string) => `bodega-palabra:${date}`;

function readGuest(date: string): WordGuess[] {
  try {
    const raw = localStorage.getItem(guestKey(date));
    const parsed = raw ? (JSON.parse(raw) as { guesses?: WordGuess[] }) : null;
    return Array.isArray(parsed?.guesses) ? parsed.guesses : [];
  } catch {
    return [];
  }
}

function writeGuest(date: string, guesses: WordGuess[], answer: string | null) {
  try {
    localStorage.setItem(guestKey(date), JSON.stringify({ guesses, answer }));
  } catch {
    // Sin almacenamiento el progreso del invitado dura lo que la pestaña.
  }
}

function readGuestAnswer(date: string): string | null {
  try {
    const raw = localStorage.getItem(guestKey(date));
    return raw
      ? ((JSON.parse(raw) as { answer?: string | null }).answer ?? null)
      : null;
  } catch {
    return null;
  }
}

function untilLabel(iso: string) {
  let s = Math.max(
    0,
    Math.floor((new Date(iso).getTime() - Date.now()) / 1000),
  );
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

function Tomorrow({ at }: { at: string }) {
  const [label, setLabel] = useState(() => untilLabel(at));
  useEffect(() => {
    const id = window.setInterval(() => setLabel(untilLabel(at)), 1000);
    return () => window.clearInterval(id);
  }, [at]);
  return (
    <div className="pw-tomorrow">
      <span>Próxima palabra en</span>
      <b className="num">{label}</b>
    </div>
  );
}

function shareText(g: Game) {
  const sq: Record<LetterResult, string> = { ok: "🟩", near: "🟨", miss: "⬛" };
  const score = g.solved ? g.guesses.length : "X";
  const fire = g.streak && g.solved ? ` 🔥${g.streak.current}` : "";
  return `Palabra Bodega #${g.number} · ${score}/${g.maxGuesses}${fire}\n${g.guesses.map((x) => x.result.map((r) => sq[r]).join("")).join("\n")}\nlabodega-ve.com/palabra`;
}

async function fetchGame(source: WordSource): Promise<Game> {
  if (source.kind === "member") {
    const w = await source.api.getWord();
    return { ...w, bonuses: w.streakBonuses };
  }
  const w = await publicGames.getWord();
  const guesses = readGuest(w.date);
  const solved = guesses.some((g) => g.result.every((r) => r === "ok"));
  const finished = solved || guesses.length >= w.maxGuesses;
  return {
    date: w.date,
    number: w.number,
    hint: w.hint,
    nextAt: w.nextAt,
    maxGuesses: w.maxGuesses,
    guesses,
    solved,
    finished,
    answer: finished
      ? solved
        ? guesses.at(-1)!.word
        : readGuestAnswer(w.date)
      : null,
    streak: null,
    pointsPerWin: 5,
    bonuses: [],
  };
}

/** La Palabra del día: pizarra, cuadrícula, teclado y resultado. */
export function WordGame({
  source,
  joinHref = "/bodega-club",
  onPointsChanged,
  notify,
}: {
  source: WordSource;
  joinHref?: string;
  /** Avisa que el saldo cambió (para refrescar la tarjeta del club). */
  onPointsChanged?: () => void;
  notify: (title: string, sub: string) => void;
}) {
  const reduce = useReducedMotion();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cur, setCur] = useState("");
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const [award, setAward] = useState<{
    points: number;
    bonus: WordBonus | null;
  } | null>(null);
  const helpRef = useRef<HTMLDialogElement>(null);
  const live = useRef<HTMLDivElement>(null);
  const say = (t: string) => {
    if (live.current) live.current.textContent = t;
  };

  useEffect(() => {
    let alive = true;
    fetchGame(source)
      .then((g) => {
        if (!alive) return;
        setGame(g);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(
          e instanceof ClubApiError && e.status === 404
            ? "off"
            : "La Palabra del día no cargó. Intenta de nuevo en un momento.",
        );
      });
    return () => {
      alive = false;
    };
  }, [source]);

  const submit = useCallback(async () => {
    if (!game || game.finished || busy) return;
    if (cur.length < 5) {
      setShake((n) => n + 1);
      notify("Faltan letras", "La palabra tiene 5.");
      say("Faltan letras. La palabra tiene 5.");
      return;
    }
    setBusy(true);
    try {
      let next: Game;
      if (source.kind === "member") {
        const r = await source.api.guessWord(cur);
        next = { ...r, bonuses: r.streakBonuses };
        if (r.awarded && (r.awarded.points || r.awarded.bonus)) {
          setAward(r.awarded);
          onPointsChanged?.();
        }
      } else {
        const attempt = game.guesses.length + 1;
        const r = await publicGames.guess(cur, attempt);
        const guesses = [
          ...game.guesses,
          { word: normalizeWord(cur), result: r.result },
        ];
        const finished = r.solved || attempt >= game.maxGuesses;
        writeGuest(game.date, guesses, r.answer);
        next = {
          ...game,
          guesses,
          solved: r.solved,
          finished,
          answer: r.answer,
        };
      }
      const row = next.guesses.length - 1;
      setReveal(row);
      setCur("");
      const last = next.guesses[row];
      say(
        `${last.word}: ${last.result.map((r, i) => `${last.word[i]} ${NAMES[r]}`).join(", ")}`,
      );
      // El resultado se muestra cuando terminan de voltearse las fichas.
      window.setTimeout(
        () => {
          setGame(next);
          setReveal(null);
          setBusy(false);
        },
        reduce ? 0 : FLIP_MS * 5 + 200,
      );
      setGame((g) => (g ? { ...g, guesses: next.guesses } : g));
    } catch (e) {
      setBusy(false);
      setShake((n) => n + 1);
      const msg = e instanceof Error ? e.message : "Intenta de nuevo.";
      notify("Ese intento no cuenta", msg);
      say(msg);
    }
  }, [busy, cur, game, notify, onPointsChanged, reduce, source]);

  const press = useCallback(
    (k: string) => {
      if (!game || game.finished || busy) return;
      if (k === "BACK") setCur((c) => c.slice(0, -1));
      else if (k === "ENTER") void submit();
      else if (/^[A-ZÑ]$/.test(k)) setCur((c) => (c.length < 5 ? c + k : c));
    },
    [busy, game, submit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable))
        return;
      if (helpRef.current?.open) return;
      if (e.key === "Enter") {
        if (t?.tagName === "BUTTON" || t?.tagName === "A") return;
        e.preventDefault();
        press("ENTER");
      } else if (e.key === "Backspace") press("BACK");
      else {
        const up = e.key.toUpperCase();
        const k = up === "Ñ" ? "Ñ" : normalizeWord(up);
        if (/^[A-ZÑ]$/.test(k)) press(k);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const keyState = useMemo(() => {
    const st: Record<string, LetterResult> = {};
    const rank = { miss: 1, near: 2, ok: 3 };
    const settled =
      reveal === null
        ? (game?.guesses ?? [])
        : (game?.guesses ?? []).slice(0, reveal);
    for (const g of settled)
      [...g.word].forEach(
        (ch, i) =>
          (!st[ch] || rank[g.result[i]] > rank[st[ch]]) &&
          (st[ch] = g.result[i]),
      );
    return st;
  }, [game, reveal]);

  const share = async () => {
    if (!game) return;
    const text = shareText(game);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        notify("Resultado copiado", "Pégalo en WhatsApp o en tu estado.");
      }
    } catch {
      // El usuario cerró la hoja de compartir: nada que hacer.
    }
  };

  if (error === "off") {
    return (
      <div className="pw">
        <div className="pw-board-sign">
          <span className="lab">Hoy en la pizarra</span>
          <h1>Palabra del día</h1>
          <p className="clue">Vuelve pronto: la pizarra está en preparación.</p>
        </div>
      </div>
    );
  }
  if (!game) {
    return (
      <div className="pw" aria-busy={!error}>
        {error ? (
          <p className="pw-error">{error}</p>
        ) : (
          <div className="pw-skeleton" />
        )}
      </div>
    );
  }

  const rowsDone = game.guesses.length;
  const solvedToday = game.solved && game.finished;
  const today = (new Date(`${game.date}T12:00:00Z`).getUTCDay() + 6) % 7;
  const streak = game.streak;
  const goal = streak
    ? game.bonuses.find((b) => b.days > streak.current)
    : null;

  return (
    <div className="pw">
      <div ref={live} className="sr" aria-live="polite" />
      <div className="pw-board-sign">
        <div className="row1">
          <span className="lab">Hoy en la pizarra · #{game.number}</span>
          <button
            type="button"
            className="help"
            onClick={() => helpRef.current?.showModal()}
            aria-label="Cómo se juega"
          >
            <CircleHelp aria-hidden="true" />
          </button>
        </div>
        <h1>Palabra del día</h1>
        {game.hint ? (
          <p className="clue">
            <Espiga className="esp" />
            <span>
              <b>Pista:</b> {game.hint}
            </span>
          </p>
        ) : null}
      </div>

      <div className="pw-layout">
        <div className="pw-play">
          <div
            className="pw-grid"
            role="grid"
            aria-label={`Tablero, ${game.maxGuesses} intentos de 5 letras`}
          >
            {Array.from({ length: game.maxGuesses }, (_, i) => {
              const g = game.guesses[i];
              const isCur = i === rowsDone && !game.finished;
              const winRow =
                game.solved &&
                game.finished &&
                i === rowsDone - 1 &&
                reveal === null;
              return (
                <div
                  key={`${i}-${isCur ? shake : 0}`}
                  className={`pw-row${isCur && shake ? " shake" : ""}${winRow && !reduce ? " win" : ""}`}
                  role="row"
                  aria-label={
                    g
                      ? `Intento ${i + 1}: ${[...g.word].map((ch, j) => `${ch} ${NAMES[g.result[j]]}`).join(", ")}`
                      : `Intento ${i + 1}${isCur && cur ? `: ${cur}` : ""}`
                  }
                >
                  {Array.from({ length: 5 }, (_, j) => {
                    const ch = g ? g.word[j] : isCur ? cur[j] : "";
                    const cls = g
                      ? `${g.result[j]}${reveal === i && !reduce ? " reveal" : ""}`
                      : ch
                        ? "filled"
                        : "";
                    return (
                      <div
                        key={j}
                        className={`pw-tile ${cls}`}
                        role="gridcell"
                        style={
                          {
                            "--d": `${j * FLIP_MS}ms`,
                            "--h": `${j * 80}ms`,
                          } as React.CSSProperties
                        }
                      >
                        {ch ?? ""}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {game.finished && reveal === null ? null : (
            <div className="pw-kb" role="group" aria-label="Teclado">
              {ROWS.map((r) => (
                <div key={r} className="kb-row">
                  {[...r].map((ch) =>
                    ch === "⏎" ? (
                      <button
                        key="enter"
                        type="button"
                        className="key wide enter"
                        onClick={() => press("ENTER")}
                        aria-label="Enviar intento"
                        disabled={busy}
                      >
                        ENVIAR
                      </button>
                    ) : ch === "⌫" ? (
                      <button
                        key="back"
                        type="button"
                        className="key wide"
                        onClick={() => press("BACK")}
                        aria-label="Borrar letra"
                      >
                        <Delete aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        key={ch}
                        type="button"
                        className={`key ${keyState[ch] ?? ""}`}
                        onClick={() => press(ch)}
                        aria-label={`${ch}${keyState[ch] ? `, ${NAMES[keyState[ch]]}` : ""}`}
                      >
                        {ch}
                      </button>
                    ),
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="pw-side">
          {streak ? (
            <div className="pw-week">
              <div
                className="fire"
                aria-label={`Racha de ${streak.current} días`}
              >
                <Flame aria-hidden="true" />
                <div>
                  <b className="num">{streak.current}</b>
                  <small>días</small>
                </div>
              </div>
              <div className="days" aria-label="Esta semana">
                {DAYS.map((d, i) => {
                  const done =
                    i < today
                      ? streak.current - (solvedToday ? 1 : 0) >= today - i
                      : i === today && solvedToday;
                  return (
                    <div
                      key={i}
                      className={`d${i === today ? " today" : ""}${done ? " done" : ""}`}
                    >
                      <span className="dot">{done ? "✓" : ""}</span>
                      {d}
                    </div>
                  );
                })}
              </div>
              {goal ? (
                <div className="msg">
                  <span>
                    {goal.days - streak.current}{" "}
                    {goal.days - streak.current === 1 ? "día" : "días"} para el
                    bono de <b>+{goal.points} pts</b>
                  </span>
                  <div className="bar" aria-hidden="true">
                    <span
                      style={{
                        transform: `scaleX(${streak.current / goal.days})`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="pw-week guest">
              <p>
                Juegas como invitado.{" "}
                <b>Los socios suman +{game.pointsPerWin} pts</b> por acierto y
                bonos por racha.
              </p>
              <Link className="pw-link" href={joinHref}>
                Unirme
              </Link>
            </div>
          )}

          {game.finished && reveal === null ? (
            <div className="pw-result" role="status">
              {game.solved ? (
                <h2>
                  ¡La sacaste{" "}
                  {game.guesses.length === 1
                    ? "al primer intento"
                    : `en ${game.guesses.length} intentos`}
                  !
                </h2>
              ) : (
                <>
                  <h2>Hoy no salió</h2>
                  {game.answer ? (
                    <div
                      className="pw-answer"
                      aria-label={`La palabra era ${game.answer}`}
                    >
                      {[...game.answer].map((c, i) => (
                        <div key={i} className="pw-tile ok">
                          {c}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
              {source.kind === "member" ? (
                game.solved ? (
                  award ? (
                    <div className="pw-gain">
                      {award.points ? (
                        <span className="g1">
                          <Coins aria-hidden="true" />+{award.points} pts
                        </span>
                      ) : null}
                      {award.bonus ? (
                        <span className="g2">
                          <Flame aria-hidden="true" />+{award.bonus.points} por{" "}
                          {award.bonus.days} días seguidos
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <p>Tus puntos de hoy ya están en tu saldo.</p>
                  )
                ) : (
                  <p>Tu racha vuelve a cero. Mañana empiezas otra.</p>
                )
              ) : (
                <>
                  <p>
                    {game.solved ? (
                      <>
                        Si fueras socio de Bodega Club habrías ganado{" "}
                        <b>+{game.pointsPerWin} pts</b> y empezado tu racha.
                      </>
                    ) : (
                      "Mañana hay otra. Los socios de Bodega Club ganan puntos cada vez que aciertan."
                    )}
                  </p>
                  <Link className="pw-btn gold" href={joinHref}>
                    <UserPlus aria-hidden="true" />
                    Unirme a Bodega Club
                  </Link>
                </>
              )}
              <button
                type="button"
                className={`pw-btn ${source.kind === "member" ? "ink" : "line"}`}
                onClick={share}
              >
                <Share2 aria-hidden="true" />
                Compartir resultado
              </button>
              <Tomorrow at={game.nextAt} />
            </div>
          ) : null}
          <section className="pw-rules" aria-labelledby="pw-rules-title">
            <h2 id="pw-rules-title">Cómo se juega</h2>
            <p>
              Adivina la palabra de 5 letras en {game.maxGuesses} intentos.
            </p>
            <Rules game={game} />
          </section>
        </aside>
      </div>

      <dialog
        ref={helpRef}
        className="pw-how"
        aria-labelledby="pw-how-title"
        onClick={(e) =>
          e.target === helpRef.current && helpRef.current?.close()
        }
      >
        <h2 id="pw-how-title">Cómo se juega</h2>
        <p>
          Adivina la palabra de 5 letras en {game.maxGuesses} intentos. Después
          de cada intento, las fichas cambian de color.
        </p>
        <Rules game={game} />
        <button
          type="button"
          className="pw-btn ink"
          onClick={() => helpRef.current?.close()}
        >
          Entendido
        </button>
      </dialog>
    </div>
  );
}

/** Ejemplos y reglas: en el diálogo de ayuda y, en escritorio, fijos al lado del tablero. */
function Rules({ game }: { game: Game }) {
  return (
    <>
      <div className="ex">
        <Example word="PANES" mark={[0, "ok"]} />
        <p>
          <b>P</b> está en su lugar.
        </p>
        <Example word="TORTA" mark={[2, "near"]} />
        <p>
          <b>R</b> está en la palabra, pero en otro lugar.
        </p>
        <Example word="MANGO" mark={[3, "miss"]} />
        <p>
          <b>G</b> no está en la palabra.
        </p>
      </div>
      <ul>
        <li>Cada día a las 12:00 a. m. hay una palabra nueva.</li>
        {game.bonuses.length ? (
          <li>
            Acertar suma +{game.pointsPerWin} pts.{" "}
            {game.bonuses
              .map((b) => `${b.days} días seguidos dan +${b.points}`)
              .join(" y ")}
            .
          </li>
        ) : null}
        <li>Las tildes no cuentan; la Ñ sí es una letra.</li>
      </ul>
    </>
  );
}

function Example({
  word,
  mark,
}: {
  word: string;
  mark: [number, LetterResult];
}) {
  return (
    <div className="pw-row" aria-hidden="true">
      {[...word].map((c, i) => (
        <div key={i} className={`pw-tile ${i === mark[0] ? mark[1] : ""}`}>
          {c}
        </div>
      ))}
    </div>
  );
}
