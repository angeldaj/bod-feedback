"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Flame,
  FlaskConical,
  Info,
  Ticket,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { ClubApiError } from "@/lib/club-api";
import {
  letterOf,
  missingOf,
  type BodingoEdition,
  type BodingoState,
  type GamesApi,
} from "@/lib/games-api";
import { useClub } from "../club-provider";
import { fmtPts } from "../club-visuals";
import { Skeleton } from "../pieces";
import {
  Board,
  BingoCard,
  CardSlots,
  type DeckSelection,
} from "../bodingo/bingo-card";
import {
  ballLabel,
  setBallFontFrom,
  startBallRain,
  Tombola,
} from "../bodingo/physics";
import { ensureBodingoTextures } from "../bodingo/textures";

const TZ = "America/Caracas";
const PRIZE_FALLBACK = "/bodega-club/hero-bodega-club.webp";

function dayLabel(iso: string, long = false) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("es-VE", {
    timeZone: TZ,
    weekday: long ? "long" : "short",
    day: "numeric",
    month: "short",
  }).format(d);
  const time = new Intl.DateTimeFormat("es-VE", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  const cap = day.charAt(0).toUpperCase() + day.slice(1);
  return `${cap.replace(/\.$/, "")} · ${time}`;
}

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k-${Date.now()}-${Math.random()}`;
}

/** Estado del Bodingo con el reloj del servidor y sondeo justo después de cada bola. */
function useBodingo(games: GamesApi, onWin: () => void) {
  const [state, setState] = useState<BodingoState | null>(null);
  const [failed, setFailed] = useState(false);
  const offset = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const load = useCallback(async () => {
    try {
      const s = await games.getBodingo();
      offset.current = new Date(s.serverNow).getTime() - Date.now();
      setState(s);
      setFailed(false);
      // La celebración se abre al recibir la bola ganadora y queda abierta aunque la partida cierre.
      if (s.myWin && s.edition?.phase === "claim") onWin();
    } catch {
      setFailed(true);
    }
  }, [games, onWin]);

  // Un solo temporizador: la primera carga (espera 0) y el sondeo justo después de cada bola.
  useEffect(() => {
    const e = state?.edition;
    const now = Date.now() + offset.current;
    let wait = 60_000;
    if (!state) wait = failed ? 10_000 : 0;
    else if (failed) wait = 10_000;
    else if (e?.phase === "warmup")
      wait = Math.max(400, new Date(e.firstBallAt).getTime() - now + 250);
    else if (e?.phase === "drawing") {
      const next =
        new Date(e.firstBallAt).getTime() +
        e.drawn.length * e.ballIntervalSeconds * 1000;
      wait = Math.min(
        e.ballIntervalSeconds * 1000 + 500,
        Math.max(400, next - now + 250),
      );
    } else if (e?.phase === "claim") wait = 2_000;
    else if (e?.phase === "on_sale" || e?.phase === "scheduled")
      wait = Math.min(
        30_000,
        Math.max(1_000, new Date(e.startsAt).getTime() - now + 300),
      );
    timer.current = window.setTimeout(() => void load(), wait);
    return () => window.clearTimeout(timer.current);
  }, [state, failed, load]);

  useEffect(() => {
    const onVisible = () =>
      document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const serverNow = useCallback(() => Date.now() + offset.current, []);
  return { state, failed, load, serverNow };
}

function useTick(ms = 1000) {
  const [, setT] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setT((t) => t + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

function Countdown({ to, serverNow }: { to: string; serverNow: () => number }) {
  useTick();
  let s = Math.max(
    0,
    Math.floor((new Date(to).getTime() - serverNow()) / 1000),
  );
  const d = Math.floor(s / 86_400);
  s %= 86_400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  const parts: [number, string][] = [
    [d, "días"],
    [h, "horas"],
    [m, "min"],
    [s, "seg"],
  ];
  return (
    <div className="bdg-clock" role="timer" aria-label="Tiempo para el inicio">
      {parts.map(([v, l]) => (
        <div key={l}>
          <b>{String(v).padStart(2, "0")}</b>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

function Ball({ n, small = false }: { n: number; small?: boolean }) {
  return (
    <div className={`bdg-ball${small ? " sm" : ""}`} aria-hidden="true">
      <div className="print">
        <div className="disc">
          {small ? null : <span className="l">{letterOf(n)}</span>}
          <span className="v">{n}</span>
        </div>
      </div>
      <span className="gloss" />
    </div>
  );
}

/** Tómbola + bola actual + bandeja. La bola nueva sale del tambor y rueda hasta su lugar. */
function Stage({
  drawn,
  onLaunch,
  onLanded,
  mine,
}: {
  drawn: number[];
  onLaunch: (n: number) => void;
  onLanded: (n: number) => void;
  mine: boolean;
}) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const drum = useRef<Tombola | null>(null);
  const seen = useRef(drawn.length);
  const last = drawn.at(-1) ?? null;

  useEffect(() => {
    if (!canvasRef.current) return;
    drum.current = new Tombola(canvasRef.current, !!reduce);
    return () => drum.current?.destroy();
  }, [reduce]);

  useLayoutEffect(() => {
    const prev = seen.current;
    seen.current = drawn.length;
    if (!last || drawn.length === prev) return;
    const el = ballRef.current;
    // Solo la bola que llega en vivo se anima; al ponerse al día se muestra directo.
    if (reduce || drawn.length - prev !== 1 || !el || !drum.current) return;
    onLaunch(last);
    drum.current.kick();
    const from = drum.current.takeBall();
    const r = el.getBoundingClientRect();
    const dx = from.x - (r.left + r.width / 2);
    const dy = from.y - (r.top + r.height / 2);
    const deg = (Math.hypot(dx, dy) / 64) * 57.3;
    const D = 820;
    const ease = "cubic-bezier(.33,0,.2,1)";
    el.animate(
      [
        { transform: `translate(${dx}px,${dy}px) scale(.12)` },
        {
          transform: `translate(${dx * 0.4}px,${dy * 0.15}px) scale(.62)`,
          offset: 0.45,
        },
        { transform: "none", offset: 0.8 },
        { transform: "translateY(3px) scale(1.06,.92)", offset: 0.88 },
        { transform: "none" },
      ],
      { duration: D, easing: ease },
    );
    el.querySelector(".print")?.animate(
      [{ transform: `rotate(${-deg}deg)` }, { transform: "rotate(0deg)" }],
      { duration: D * 0.8, easing: ease },
    );
    const t = window.setTimeout(() => {
      el.querySelector(".disc")?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.14)" },
          { transform: "scale(1)" },
        ],
        { duration: 280, easing: "ease-out" },
      );
      onLanded(last);
    }, D * 0.82);
    return () => window.clearTimeout(t);
  }, [drawn.length, last, onLaunch, onLanded, reduce]);

  const tray = drawn.slice(-6, -1).reverse();
  return (
    <div className="bdg-stage">
      <canvas ref={canvasRef} className="bdg-tombola" aria-hidden="true" />
      <div className="bdg-spot">
        <span className="floor" />
        {last ? (
          <div ref={ballRef} key={last} className="bdg-ball-wrap">
            <Ball n={last} />
          </div>
        ) : null}
        <div className="callout" aria-live="polite">
          {last ? (
            <>
              <span className="sr">{ballLabel(last)}.</span>
              {mine ? <span className="hitchip">En tu cartón</span> : null}
            </>
          ) : (
            <span className="wait">Girando la tómbola…</span>
          )}
        </div>
      </div>
      <div className="bdg-tray" aria-hidden="true">
        {tray.map((n) => (
          <Ball key={n} n={n} small />
        ))}
        <span className="lab">Anteriores</span>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Winners({ edition }: { edition: BodingoEdition }) {
  if (!edition.winners.length) return null;
  const [first, ...rest] = edition.winners;
  const ball = edition.winningBall ? ballLabel(edition.winningBall) : null;
  return (
    <div className="bdg-winner" role="status">
      {first.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar externo (Cloudinary), tamaño fijo
        <img
          className="avatar"
          src={first.avatarUrl}
          alt=""
          width={56}
          height={56}
        />
      ) : (
        <span className="avatar">{initials(first.nameShown)}</span>
      )}
      <div>
        <h3>
          ¡{first.nameShown}
          {rest.length
            ? ` y ${rest.length === 1 ? rest[0].nameShown : `${rest.length} más`}`
            : ""}{" "}
          {rest.length ? "cantaron" : "cantó"} Bodingo!
        </h3>
        <p>
          {ball ? `Con la bola ${ball}. ` : ""}
          {rest.length
            ? "Cada uno se lleva el premio completo."
            : `Se lleva ${edition.prize.title.toLowerCase()}.`}
        </p>
      </div>
    </div>
  );
}

/** Cantar "¡Bodingo!" con su cuenta de 30 s; después, la celebración con las bolas. */
function WinOverlay({
  edition,
  deadline,
  claimedAlready,
  fontClass,
  serverNow,
  onClaim,
  onClose,
  walletHref,
}: {
  edition: BodingoEdition;
  deadline: string;
  claimedAlready: boolean;
  fontClass: string;
  serverNow: () => number;
  onClaim: () => Promise<void>;
  onClose: () => void;
  walletHref: string;
}) {
  const reduce = useReducedMotion();
  const [tapped, setTapped] = useState(claimedAlready);
  const [claimFailed, setClaimFailed] = useState(false);
  // Las bolas de la lluvia se fijan al abrir: el sondeo no debe reiniciarla.
  const [balls] = useState(() => ({
    drawn: edition.drawn,
    winning: edition.winningBall,
  }));
  const hostRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useTick(250);
  const left = Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - serverNow()) / 1000),
  );
  // A los 30 s sin tocar se canta solo: la etapa sale del reloj.
  const stage: "claim" | "won" = tapped || left <= 0 ? "won" : "claim";
  const byUs = claimFailed || (!tapped && left <= 0);

  useEffect(() => {
    if (stage === "claim") buttonRef.current?.focus();
    if (stage !== "won" || reduce || !hostRef.current) return;
    return startBallRain(hostRef.current, balls.drawn, balls.winning);
  }, [stage, reduce, balls]);

  const claim = async () => {
    setTapped(true);
    try {
      await onClaim();
    } catch {
      setClaimFailed(true);
    }
  };

  const C = 2 * Math.PI * 110;
  const ball = edition.winningBall ? ballLabel(edition.winningBall) : "";
  return createPortal(
    <div
      ref={hostRef}
      className={`bdg bdg-overlay ${fontClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bdg-win-title"
    >
      {stage === "claim" ? (
        <div className="bdg-claim">
          <p className="lead" id="bdg-win-title">
            ¡Tu cartón está lleno!
          </p>
          <button
            ref={buttonRef}
            type="button"
            className="bdg-bingo-btn"
            onClick={claim}
            aria-describedby="bdg-claim-help"
          >
            <svg
              viewBox="0 0 236 236"
              width="236"
              height="236"
              aria-hidden="true"
            >
              <circle
                cx="118"
                cy="118"
                r="110"
                fill="none"
                stroke="rgba(247,242,231,.15)"
                strokeWidth="7"
              />
              <circle
                cx="118"
                cy="118"
                r="110"
                fill="none"
                stroke="#F0C274"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - left / 30)}
              />
            </svg>
            <span className="face">¡Bodingo!</span>
          </button>
          <span className="secs num" aria-hidden="true">
            {left} s
          </span>
          <p id="bdg-claim-help">
            Tócalo para cantarlo. Si no llegas, lo cantamos por ti a los 30
            segundos. El premio es tuyo igual.
          </p>
        </div>
      ) : (
        <div className="bdg-won">
          <h2 className="bdg-wordmark" id="bdg-win-title">
            ¡Bodingo!
          </h2>
          <p>
            {byUs ? "Lo cantamos por ti" : "Lo cantaste"} con la bola{" "}
            <b className="num">{ball}</b>. Todos en la mesa ya lo saben.
          </p>
          <div className="bdg-voucher">
            <div className="vl">
              <small>Premio del Bodingo</small>
              <b>{edition.prize.title}</b>
              <span>
                Llega a tu Wallet en unos segundos, al cerrar la partida.
              </span>
            </div>
            <div className="vr">BODINGO</div>
          </div>
          <Link href={walletHref} className="bdg-btn gold">
            <Wallet aria-hidden="true" />
            Ver mi Wallet
          </Link>
          <button type="button" className="bdg-btn ghost" onClick={onClose}>
            Volver al juego
          </button>
          {reduce ? null : <p className="hint">Agarra las bolas y lánzalas.</p>}
        </div>
      )}
    </div>,
    document.body,
  );
}

function DemoBar({
  games,
  reload,
}: {
  games: GamesApi;
  reload: () => Promise<void>;
}) {
  const demo = games.demo;
  if (!demo) return null;
  const run = (fn: () => void) => () => {
    fn();
    void reload();
  };
  return (
    <div className="bdg-demo" role="group" aria-label="Controles de la demo">
      <span>
        <FlaskConical aria-hidden="true" />
        Demo
      </span>
      <button type="button" onClick={run(() => demo.start("win"))}>
        Arrancar: ganas tú
      </button>
      <button type="button" onClick={run(() => demo.start("other"))}>
        Arrancar: gana otra persona
      </button>
      <button type="button" onClick={run(() => demo.start("empty"))}>
        Sin mesa
      </button>
      <button type="button" onClick={run(demo.reset)}>
        Reiniciar
      </button>
    </div>
  );
}

export function BodingoScreen() {
  const { games, card, reload: reloadClub, notify, href } = useClub();
  const [overlay, setOverlay] = useState<"closed" | "open" | "dismissed">(
    "closed",
  );
  const openWin = useCallback(
    () => setOverlay((o) => (o === "closed" ? "open" : o)),
    [],
  );
  const { state, failed, load, serverNow } = useBodingo(games, openWin);
  const [buying, setBuying] = useState(false);
  const [buyKey, setBuyKey] = useState(newKey);
  const [selected, setSelected] = useState<DeckSelection>({
    kind: "card",
    index: 0,
  });
  /** Bola que va rodando: los cartones la marcan cuando aterriza. */
  const [rolling, setRolling] = useState<number | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const [fontClass, setFontClass] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureBodingoTextures();
    const fonts = rootRef.current?.closest(".game-fonts");
    setBallFontFrom(fonts ?? null);
    setFontClass(fonts?.className ?? "");
  }, []);

  const edition = state?.edition ?? null;
  const cards = useMemo(
    () => (state?.myCards ?? []).filter((c) => !c.refundedAt),
    [state],
  );
  const drawn = useMemo(() => edition?.drawn ?? [], [edition]);
  const shownCount =
    rolling !== null && drawn.at(-1) === rolling
      ? drawn.length - 1
      : drawn.length;
  const drawnSet = useMemo(
    () => new Set(drawn.slice(0, shownCount)),
    [drawn, shownCount],
  );
  const shownLast = drawn[shownCount - 1] ?? null;
  const onLaunch = useCallback((n: number) => setRolling(n), []);
  const onLanded = useCallback((n: number) => {
    setRolling(null);
    setFresh(n);
    try {
      navigator.vibrate?.(14);
    } catch {
      // Sin vibración en este dispositivo.
    }
  }, []);
  useEffect(() => {
    if (fresh === null) return;
    const t = window.setTimeout(() => setFresh(null), 900);
    return () => window.clearTimeout(t);
  }, [fresh]);

  const buy = async () => {
    if (!edition || buying) return;
    setBuying(true);
    try {
      const r = await games.buyBodingoCard(edition.id, buyKey);
      setBuyKey(newKey());
      await Promise.all([load(), reloadClub()]);
      setSelected({ kind: "card", index: cards.length });
      notify(
        Ticket,
        `Cartón Nº ${String(r.card.serial).padStart(4, "0")} listo`,
        "Ya estás en la mesa del domingo.",
      );
    } catch (error) {
      if (error instanceof ClubApiError && error.status < 500)
        setBuyKey(newKey());
      notify(
        TriangleAlert,
        "No pudimos comprar el cartón",
        error instanceof Error
          ? error.message
          : "Intenta de nuevo en un momento.",
      );
      void load();
    } finally {
      setBuying(false);
    }
  };

  if (!state) {
    return (
      <div className="bdg view" ref={rootRef} aria-busy={!failed}>
        {failed ? (
          <Empty
            title="No pudimos cargar el Bodingo"
            text="Revisa tu conexión; lo intentamos de nuevo en unos segundos."
          />
        ) : (
          <Skeleton height={420} />
        )}
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="bdg view" ref={rootRef}>
        <Empty
          title="No hay Bodingo programado"
          text="Cuando el equipo publique el próximo, lo verás aquí con su premio."
        />
        <DemoBar games={games} reload={load} />
      </div>
    );
  }

  const live =
    edition.phase === "warmup" ||
    edition.phase === "drawing" ||
    edition.phase === "claim";
  const sale = edition.phase === "on_sale";
  const balance = card?.balance ?? 0;
  const canBuy =
    sale &&
    cards.length < edition.maxCardsPerMember &&
    balance >= edition.cardPricePoints;
  const selection: DeckSelection =
    selected.kind === "card" && selected.index >= cards.length
      ? { kind: "card", index: 0 }
      : selected;
  const current = selection.kind === "card" ? cards[selection.index] : null;
  const best = cards.length
    ? Math.min(...cards.map((c) => missingOf(c, drawnSet).length))
    : null;
  const near =
    live &&
    cards
      .map((c) => ({ c, m: missingOf(c, drawnSet) }))
      .find((x) => x.m.length === 1);
  const date = dayLabel(edition.startsAt);
  const myWin = state.myWin;

  const deck = cards.length ? (
    <section className="bdg-deck" aria-label="Tus cartones">
      <div className="bdg-sect-h">
        <h2>Tus cartones</h2>
        <span>
          {cards.length} de {edition.maxCardsPerMember}
        </span>
      </div>
      <CardSlots
        cards={cards}
        drawn={drawnSet}
        fresh={fresh}
        selected={selection}
        onSelect={setSelected}
        live={live}
        freeSlots={sale ? edition.maxCardsPerMember - cards.length : 0}
        price={edition.cardPricePoints}
        canBuy={canBuy}
        buying={buying}
        onBuy={buy}
        drawnCount={shownCount}
      />
      {selection.kind === "board" ? (
        <Board drawn={drawnSet} last={shownLast} />
      ) : current ? (
        <BingoCard
          key={current.id}
          card={current}
          drawn={drawnSet}
          fresh={fresh}
          showNeed={live}
          dateLabel={date}
        />
      ) : null}
    </section>
  ) : null;

  return (
    <div className={`bdg view${live ? " is-live" : ""}`} ref={rootRef}>
      <DemoBar games={games} reload={load} />

      {live ? (
        <>
          <div className="bdg-live-top">
            <span className="bdg-live-pill">En vivo</span>
            <span className="num">{edition.players} en la mesa</span>
            <span className="bdg-count">
              Bola <b className="num">{shownCount}</b> de 75
            </span>
          </div>
          <div className="bdg-live">
            <div className="bdg-live-main">
              {edition.phase === "warmup" ? (
                <Warmup edition={edition} serverNow={serverNow} />
              ) : (
                <Stage
                  drawn={drawn}
                  onLaunch={onLaunch}
                  onLanded={onLanded}
                  mine={
                    !!shownLast &&
                    cards.some((c) => c.numbers.includes(shownLast))
                  }
                />
              )}
              {edition.phase === "claim" && !myWin ? (
                <Winners edition={edition} />
              ) : null}
              {near ? (
                <div className="bdg-near" role="status">
                  <Flame aria-hidden="true" />
                  <span>
                    Te falta la <b className="num">{ballLabel(near.m[0])}</b> en
                    el Nº {String(near.c.serial).padStart(4, "0")}.
                  </span>
                </div>
              ) : null}
              {!cards.length ? (
                <p className="bdg-note">
                  Estás mirando como espectador. Compra tu cartón para el
                  próximo Bodingo.
                </p>
              ) : null}
            </div>
            <div className="bdg-live-side">{deck}</div>
          </div>
        </>
      ) : (
        <>
          <Hero edition={edition} />
          <div className="bdg-cols">
            <div className="bdg-col-main">
              {sale || edition.phase === "scheduled" ? (
                <SaleInfo
                  edition={edition}
                  serverNow={serverNow}
                  sale={sale}
                  balance={balance}
                  cards={cards.length}
                  canBuy={canBuy}
                  buying={buying}
                  onBuy={buy}
                />
              ) : null}
              {edition.phase === "finished" ? (
                myWin ? (
                  <div className="bdg-msg">
                    <h2>Ganaste {edition.prize.title.toLowerCase()}</h2>
                    <p>
                      Tu voucher ya está en el Wallet. Lo muestras en caja como
                      cualquier otro.
                    </p>
                    <Link href={href("wallet")} className="bdg-btn gold">
                      <Wallet aria-hidden="true" />
                      Ver mi Wallet
                    </Link>
                  </div>
                ) : (
                  <>
                    <Winners edition={edition} />
                    {best !== null ? (
                      <p className="bdg-note">
                        <Info aria-hidden="true" />A tu mejor cartón le{" "}
                        {best === 1
                          ? "faltó 1 número"
                          : `faltaron ${best} números`}
                        .
                      </p>
                    ) : null}
                  </>
                )
              ) : null}
              {edition.phase === "cancelled" ? (
                <div className="bdg-msg">
                  <h2>Esta vez no se completó la mesa</h2>
                  <p>
                    {edition.cancelReason ?? "El Bodingo se canceló."} Si
                    compraste cartones, tus puntos ya volvieron a tu saldo.
                  </p>
                </div>
              ) : null}
              <details className="bdg-rules">
                <summary>
                  Cómo se juega <ChevronDown aria-hidden="true" />
                </summary>
                <ol>
                  <li>
                    Compra hasta {edition.maxCardsPerMember} cartones con tus
                    puntos antes de la hora de inicio.
                  </li>
                  <li>
                    A esa hora cierra la venta y 45 segundos después sale la
                    primera bola. Sale una cada {edition.ballIntervalSeconds}{" "}
                    segundos.
                  </li>
                  <li>
                    Tus cartones se marcan solos. No tienes que estar pendiente.
                  </li>
                  <li>
                    Gana el primer cartón lleno. Si varios se llenan con la
                    misma bola, todos ganan el premio completo.
                  </li>
                  <li>
                    Si no llegamos a {edition.minPlayers} jugadores, se cancela
                    y te devolvemos los puntos.
                  </li>
                </ol>
              </details>
            </div>
            {deck}
          </div>
        </>
      )}

      {overlay === "open" && myWin ? (
        <WinOverlay
          edition={edition}
          deadline={myWin.claimDeadline}
          claimedAlready={myWin.claimed}
          fontClass={fontClass}
          serverNow={serverNow}
          onClaim={async () => {
            await games.claimBodingo();
          }}
          onClose={() => {
            setOverlay("dismissed");
            void load();
          }}
          walletHref={href("wallet")}
        />
      ) : null}
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="bdg-msg">
      <CalendarClock aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Hero({ edition }: { edition: BodingoEdition }) {
  return (
    <div className="bdg-hero">
      {/* eslint-disable-next-line @next/next/no-img-element -- la foto del premio puede venir de Cloudinary */}
      <img
        src={edition.prize.imageUrl ?? PRIZE_FALLBACK}
        alt={`Premio: ${edition.prize.title}`}
      />
      <div className="copy">
        <h1 className="bdg-wordmark">Bodingo</h1>
        <p>{dayLabel(edition.startsAt, true)} · Cartón lleno</p>
      </div>
    </div>
  );
}

function SaleInfo({
  edition,
  serverNow,
  sale,
  balance,
  cards,
  canBuy,
  buying,
  onBuy,
}: {
  edition: BodingoEdition;
  serverNow: () => number;
  sale: boolean;
  balance: number;
  cards: number;
  canBuy: boolean;
  buying: boolean;
  onBuy: () => void;
}) {
  const max = cards >= edition.maxCardsPerMember;
  const short = balance < edition.cardPricePoints;
  const confirmed = edition.players >= edition.minPlayers;
  return (
    <>
      <div className="bdg-prize">
        <span className="kicker">Premio de esta semana</span>
        <h2>{edition.prize.title}</h2>
        {edition.prize.description ? (
          <p>{edition.prize.description} Llega como voucher a tu Wallet.</p>
        ) : null}
      </div>
      <Countdown
        to={sale ? edition.startsAt : edition.publishAt}
        serverNow={serverNow}
      />
      {!sale ? (
        <p className="bdg-note">
          La venta de cartones abre {dayLabel(edition.publishAt)}.
        </p>
      ) : null}
      <div className="bdg-mesa">
        <div className="top">
          <span>
            <b className="num">{edition.players}</b> jugadores en la mesa
          </span>
          {confirmed ? (
            <span className="ok">
              <Check aria-hidden="true" />
              Mesa confirmada
            </span>
          ) : (
            <span>Faltan {edition.minPlayers - edition.players}</span>
          )}
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-label="Jugadores para abrir la mesa"
          aria-valuemin={0}
          aria-valuemax={edition.minPlayers}
          aria-valuenow={Math.min(edition.players, edition.minPlayers)}
        >
          <span
            style={{
              transform: `scaleX(${Math.min(1, edition.players / edition.minPlayers)})`,
            }}
          />
        </div>
        <small>
          Se juega con un mínimo de {edition.minPlayers}. Si no llegamos, te
          devolvemos los puntos.
        </small>
      </div>
      {sale ? (
        <div className="bdg-buy">
          <button
            type="button"
            className="bdg-btn gold"
            disabled={!canBuy || buying}
            onClick={onBuy}
          >
            {buying ? (
              <>
                <span className="spin" aria-hidden="true" />
                Comprando…
              </>
            ) : max ? (
              "Ya tienes tus cartones"
            ) : (
              <>
                <Ticket aria-hidden="true" />
                Comprar cartón ·{" "}
                <span className="num">{edition.cardPricePoints}</span> pts
              </>
            )}
          </button>
          <small>
            {max
              ? `Es el máximo por persona en cada Bodingo.`
              : short
                ? `Te faltan ${fmtPts(edition.cardPricePoints - balance)} pts para un cartón.`
                : `Puedes tener hasta ${edition.maxCardsPerMember}. Te quedarían ${fmtPts(balance - edition.cardPricePoints)} pts.`}
          </small>
        </div>
      ) : null}
    </>
  );
}

function Warmup({
  edition,
  serverNow,
}: {
  edition: BodingoEdition;
  serverNow: () => number;
}) {
  useTick(250);
  const left = Math.max(
    0,
    Math.ceil((new Date(edition.firstBallAt).getTime() - serverNow()) / 1000),
  );
  const total = Math.max(
    1,
    Math.round(
      (new Date(edition.firstBallAt).getTime() -
        new Date(edition.startsAt).getTime()) /
        1000,
    ),
  );
  const C = 2 * Math.PI * 76;
  return (
    <div
      className="bdg-warm"
      role="timer"
      aria-label="Cuenta regresiva para la primera bola"
    >
      <div className="ring">
        <svg viewBox="0 0 168 168" width="168" height="168" aria-hidden="true">
          <circle
            cx="84"
            cy="84"
            r="76"
            fill="none"
            stroke="rgba(247,242,231,.12)"
            strokeWidth="8"
          />
          <circle
            cx="84"
            cy="84"
            r="76"
            fill="none"
            stroke="#D9A94A"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - left / total)}
          />
        </svg>
        <b className="num">{left}</b>
      </div>
      <h2>
        Arrancamos en{" "}
        <span className="num">0:{String(left).padStart(2, "0")}</span>
      </h2>
      <p>Avísale a la familia. La primera bola sale cuando llegue a cero.</p>
    </div>
  );
}

/** Tarjeta de Inicio: venta, en vivo o resultado. Sin Bodingo programado no aparece. */
export function BodingoTile() {
  const { games, href } = useClub();
  const [state, setState] = useState<BodingoState | null>(null);
  useEffect(() => {
    let alive = true;
    games
      .getBodingo()
      .then((s) => alive && setState(s))
      .catch(() => alive && setState(null));
    return () => {
      alive = false;
    };
  }, [games]);
  const e = state?.edition;
  if (!e || e.phase === "cancelled") return null;
  const live =
    e.phase === "warmup" || e.phase === "drawing" || e.phase === "claim";
  return (
    <Link
      href={href("bodingo")}
      className={`tile bdg-tile${live ? " live" : ""}`}
    >
      <span className="bt-ball" aria-hidden="true">
        B
      </span>
      <span className="bt-body">
        <b>{live ? "Bodingo en vivo" : "Bodingo"}</b>
        <small>
          {live
            ? `${e.players} en la mesa. Entra ya.`
            : e.phase === "finished"
              ? e.winners.length
                ? `Ganó ${e.winners[0].nameShown}. El próximo, pronto.`
                : "Terminó la partida."
              : `${dayLabel(e.startsAt)} · ${e.prize.title}`}
        </small>
      </span>
      {live ? (
        <span className="bt-live">En vivo</span>
      ) : (
        <ChevronRight aria-hidden="true" />
      )}
    </Link>
  );
}
