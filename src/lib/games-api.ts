// Minijuegos de Bodega Club (spec 153 de bodega-api): Bodingo y Palabra del día.
//
// - `createLiveGames`: backend real con la sesión Bearer del socio (`/mi-club`).
// - `publicGames`: lo que ve un visitante sin cuenta (`/palabra`, espectador del Bodingo).
// - `createMockGames`: datos de ejemplo con reloj propio para `/club-mock`.
//
// El servidor decide todo: qué bolas ya salieron, quién ganó y cuál es la
// palabra. El frontend solo anima lo que recibe.

import {
  API_BASE_URL,
  ClubApiError,
  request,
  type AuthedRequest,
} from "./club-api";

// ---------------------------------------------------------------------------
// Tipos del contrato (openapi.json de bodega-api, spec 153)
// ---------------------------------------------------------------------------

export type BodingoPhase =
  | "scheduled"
  | "on_sale"
  | "warmup"
  | "drawing"
  | "claim"
  | "finished"
  | "cancelled";

export type BodingoWinner = {
  nameShown: string;
  avatarUrl: string | null;
  claimed: boolean;
};

export type BodingoEdition = {
  id: string;
  status: "scheduled" | "on_sale" | "live" | "finished" | "cancelled";
  phase: BodingoPhase;
  prize: { title: string; description: string | null; imageUrl: string | null };
  publishAt: string;
  startsAt: string;
  firstBallAt: string;
  ballIntervalSeconds: number;
  cardPricePoints: number;
  maxCardsPerMember: number;
  minPlayers: number;
  players: number;
  cards: number;
  /** Bolas ya cantadas, en orden. Nunca trae bolas futuras. */
  drawn: number[];
  winningBall: number | null;
  endsAt: string | null;
  winners: BodingoWinner[];
  cancelReason: string | null;
};

export type BodingoCard = {
  id: string;
  serial: number;
  /** 24 números por columnas B-I-N-G-O, de arriba a abajo, sin el centro. */
  numbers: number[];
  pointsSpent: number;
  refundedAt: string | null;
};

export type BodingoMyWin = {
  cardIds: string[];
  claimDeadline: string;
  claimed: boolean;
  voucherIds: string[];
};

export type BodingoState = {
  serverNow: string;
  edition: BodingoEdition | null;
  myCards: BodingoCard[];
  myWin: BodingoMyWin | null;
};

export type LetterResult = "ok" | "near" | "miss";
export type WordGuess = { word: string; result: LetterResult[] };
export type WordBonus = { days: number; points: number };

export type WordToday = {
  date: string;
  number: number;
  hint: string | null;
  maxGuesses: number;
  guesses: WordGuess[];
  solved: boolean;
  finished: boolean;
  answer: string | null;
  streak: { current: number; best: number };
  nextAt: string;
  pointsPerWin: number;
  streakBonuses: WordBonus[];
};

export type WordGuessResult = WordToday & {
  awarded: { points: number; bonus: WordBonus | null } | null;
};

export type GuestWordToday = {
  date: string;
  number: number;
  hint: string | null;
  maxGuesses: number;
  nextAt: string;
};
export type GuestGuessResult = {
  result: LetterResult[];
  solved: boolean;
  answer: string | null;
};

/** Lo que una pantalla de juego necesita, venga del backend o del mock. */
export interface GamesApi {
  getBodingo(): Promise<BodingoState>;
  /** Misma `idempotencyKey` → el mismo cartón, sin cobrar otra vez. */
  buyBodingoCard(
    editionId: string,
    idempotencyKey: string,
  ): Promise<{ card: BodingoCard; replayed: boolean }>;
  claimBodingo(): Promise<{ claimedAt: string }>;
  getWord(): Promise<WordToday>;
  guessWord(guess: string): Promise<WordGuessResult>;
  /** Solo el mock: arranca una partida para verla completa. */
  demo: BodingoDemo | null;
}

export type BodingoDemo = {
  start: (outcome: "win" | "other" | "empty") => void;
  reset: () => void;
};

// ---------------------------------------------------------------------------
// Backend real
// ---------------------------------------------------------------------------

export function createLiveGames(authed: AuthedRequest): GamesApi {
  return {
    getBodingo: () =>
      authed((t) => request<BodingoState>("/loyalty/me/bodingo", t)),
    buyBodingoCard: (editionId, idempotencyKey) =>
      authed((t) =>
        request<{ card: BodingoCard; replayed: boolean }>(
          "/loyalty/me/bodingo/cards",
          t,
          {
            method: "POST",
            body: JSON.stringify({ editionId }),
            headers: { "Idempotency-Key": idempotencyKey },
          },
        ),
      ),
    claimBodingo: () =>
      authed((t) =>
        request<{ claimedAt: string }>("/loyalty/me/bodingo/claim", t, {
          method: "POST",
        }),
      ),
    getWord: () =>
      authed((t) => request<WordToday>("/loyalty/me/word/today", t)),
    guessWord: (guess) =>
      authed((t) =>
        request<WordGuessResult>("/loyalty/me/word/guesses", t, {
          method: "POST",
          body: JSON.stringify({ guess }),
        }),
      ),
    demo: null,
  };
}

async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const b = (body ?? {}) as { message?: unknown; code?: unknown };
    throw new ClubApiError(
      b.message ? String(b.message) : `Error ${response.status}`,
      response.status,
      b.code ? String(b.code) : null,
    );
  }
  return body as T;
}

export const publicGames = {
  getBodingo: () =>
    publicRequest<Omit<BodingoState, "myCards" | "myWin">>(
      "/loyalty/bodingo/current",
    ),
  getWord: () => publicRequest<GuestWordToday>("/loyalty/word/today"),
  guess: (guess: string, attempt: number) =>
    publicRequest<GuestGuessResult>("/loyalty/word/guess", {
      method: "POST",
      body: JSON.stringify({ guess, attempt }),
    }),
};

// ---------------------------------------------------------------------------
// Reglas compartidas (las mismas del dominio del backend)
// ---------------------------------------------------------------------------

export const BINGO_LETTERS = ["B", "I", "N", "G", "O"] as const;
export const letterOf = (n: number) => BINGO_LETTERS[Math.floor((n - 1) / 15)];

/** Columnas del cartón (la N trae `0` en el centro libre). */
export function cardColumns(numbers: number[]): number[][] {
  return [
    numbers.slice(0, 5),
    numbers.slice(5, 10),
    [...numbers.slice(10, 12), 0, ...numbers.slice(12, 14)],
    numbers.slice(14, 19),
    numbers.slice(19, 24),
  ];
}

export const missingOf = (card: BodingoCard, drawn: Set<number>) =>
  card.numbers.filter((n) => !drawn.has(n));

export function normalizeWord(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .split("Ñ")
    .map((part) => part.normalize("NFD").replace(/[̀-ͯ]/g, ""))
    .join("Ñ");
}

export function evaluateGuess(guess: string, answer: string): LetterResult[] {
  const res: LetterResult[] = Array(5).fill("miss");
  const pool = new Map<string, number>();
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) res[i] = "ok";
    else pool.set(answer[i], (pool.get(answer[i]) ?? 0) + 1);
  }
  for (let i = 0; i < 5; i++) {
    const left = pool.get(guess[i]) ?? 0;
    if (res[i] !== "ok" && left > 0) {
      res[i] = "near";
      pool.set(guess[i], left - 1);
    }
  }
  return res;
}

// ---------------------------------------------------------------------------
// Mock (/club-mock): reloj propio y partida acelerada
// ---------------------------------------------------------------------------

/** Lo que el mock de juegos necesita del mock del club (saldo y actividad). */
export type MockWallet = {
  balance: () => number;
  /** Ajusta el saldo y deja el movimiento en Actividad. */
  move: (points: number, title: string, detail: string) => void;
  grantVoucher: (title: string, note: string) => void;
  firstName: string;
};

const DEMO_WARMUP_S = 8;
const DEMO_INTERVAL_S = 2;
const MOCK_WORDS = new Set(
  "AREPA PANES QUESO TORTA DULCE HORNO CACAO LECHE CREMA MASAS MIGAS TRIGO JAMON POLLO CARNE PASTA SALSA MANGO FRESA LIMON MELON TAZAS PLATO AVENA ARROZ HUEVO MOLDE BOLLO GUISO CHAMO PANAS GOFIO ROSCA CLAVO MENTA SABOR PIZZA DONAS TARTA PAPAS CALDO ASADO JUGOS COCOS AJIES ARENA PERRO GATOS MESAS SILLA PLAYA NOCHE TARDE VERDE ROJOS BUENO CIELO MUNDO LIBRO CARTA LLAVE PIANO RELOJ".split(
    " ",
  ),
);

function rand(max: number) {
  return Math.floor(Math.random() * max);
}
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomCard(serial: number): BodingoCard {
  const numbers: number[] = [];
  for (let c = 0; c < 5; c++) {
    const pool = shuffle(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1));
    numbers.push(...pool.slice(0, c === 2 ? 4 : 5).sort((a, b) => a - b));
  }
  return {
    id: `card-${serial}`,
    serial,
    numbers,
    pointsSpent: 150,
    refundedAt: null,
  };
}

function nextSunday7pm(from = new Date()): Date {
  const caracas = new Date(from.getTime() - 4 * 3_600_000);
  const add = (7 - caracas.getUTCDay()) % 7 || 7;
  return new Date(
    Date.UTC(
      caracas.getUTCFullYear(),
      caracas.getUTCMonth(),
      caracas.getUTCDate() + add,
      23,
      0,
      0,
    ),
  );
}

export function createMockGames(wallet: MockWallet): GamesApi {
  type Mock = {
    edition: BodingoEdition;
    cards: BodingoCard[];
    keys: Map<string, BodingoCard>;
    sequence: number[];
    winCount: number;
    mineWins: boolean;
    claimed: boolean;
    paid: boolean;
  };
  const fresh = (): Mock => {
    const startsAt = nextSunday7pm();
    return {
      edition: {
        id: "demo-edition",
        status: "on_sale",
        phase: "on_sale",
        prize: {
          title: "Almuerzo para dos",
          description:
            "Dos platos del día, bebidas y postre en cualquier sede.",
          imageUrl: null,
        },
        publishAt: new Date(startsAt.getTime() - 7 * 86_400_000).toISOString(),
        startsAt: startsAt.toISOString(),
        firstBallAt: new Date(startsAt.getTime() + 45_000).toISOString(),
        ballIntervalSeconds: 7,
        cardPricePoints: 150,
        maxCardsPerMember: 3,
        minPlayers: 20,
        players: 37,
        cards: 64,
        drawn: [],
        winningBall: null,
        endsAt: null,
        winners: [],
        cancelReason: null,
      },
      cards: [randomCard(427)],
      keys: new Map(),
      sequence: [],
      winCount: 0,
      mineWins: false,
      claimed: false,
      paid: false,
    };
  };
  let m = fresh();

  const view = (): BodingoState => {
    const now = Date.now();
    const e = m.edition;
    if (e.status === "live") {
      const first = new Date(e.firstBallAt).getTime();
      const count =
        now < first
          ? 0
          : Math.min(
              m.winCount,
              Math.floor((now - first) / (e.ballIntervalSeconds * 1000)) + 1,
            );
      e.drawn = m.sequence.slice(0, count);
      const winAt = first + (m.winCount - 1) * e.ballIntervalSeconds * 1000;
      const endsAt = winAt + 30_000;
      const revealed = count >= m.winCount;
      e.phase =
        now < first
          ? "warmup"
          : !revealed
            ? "drawing"
            : now < endsAt
              ? "claim"
              : "finished";
      e.winningBall = revealed ? m.sequence[m.winCount - 1] : null;
      e.endsAt = revealed ? new Date(endsAt).toISOString() : null;
      e.winners = revealed
        ? m.mineWins
          ? [
              {
                nameShown: wallet.firstName,
                avatarUrl: null,
                claimed: m.claimed,
              },
            ]
          : [{ nameShown: "María G.", avatarUrl: null, claimed: true }]
        : [];
      if (e.phase === "finished" && m.mineWins && !m.paid) {
        m.paid = true;
        wallet.grantVoucher(e.prize.title, "Premio del Bodingo");
      }
    }
    const won = e.status === "live" && e.winningBall !== null && m.mineWins;
    return {
      serverNow: new Date(now).toISOString(),
      edition: { ...e, drawn: [...e.drawn], winners: [...e.winners] },
      myCards: m.cards.map((c) => ({ ...c })),
      myWin: won
        ? {
            cardIds: [m.cards[0].id],
            claimDeadline: e.endsAt!,
            claimed: m.claimed,
            voucherIds: e.phase === "finished" ? ["demo"] : [],
          }
        : null,
    };
  };

  const start = (outcome: "win" | "other" | "empty") => {
    const e = m.edition;
    const now = Date.now();
    e.startsAt = new Date(now).toISOString();
    e.firstBallAt = new Date(now + DEMO_WARMUP_S * 1000).toISOString();
    e.ballIntervalSeconds = DEMO_INTERVAL_S;
    m.claimed = false;
    m.paid = false;
    if (outcome === "empty") {
      e.status = "cancelled";
      e.phase = "cancelled";
      e.players = 14;
      e.cancelReason = "Llegamos a 14 de los 20 jugadores necesarios.";
      const back = m.cards.reduce((s, c) => s + c.pointsSpent, 0);
      m.cards = m.cards.map((c) => ({ ...c, refundedAt: e.startsAt }));
      if (back)
        wallet.move(
          back,
          "Te devolvimos tus cartones de Bodingo",
          "No se completó la mesa",
        );
      return;
    }
    if (!m.cards.length) m.cards = [randomCard(427)];
    e.status = "live";
    m.mineWins = outcome === "win";
    const target = m.cards[0];
    // Partida corta para la demo: el cartón 1 se llena con la bola 32 (o le faltan 2 si gana otra persona).
    const need = shuffle([...target.numbers]);
    const others = shuffle(
      Array.from({ length: 75 }, (_, i) => i + 1).filter(
        (n) => !target.numbers.includes(n),
      ),
    );
    if (m.mineWins) {
      const last = need.pop()!;
      m.sequence = [
        ...shuffle([...need, ...others.slice(0, 31 - need.length)]),
        last,
        ...others.slice(31 - need.length),
      ];
      m.winCount = 32;
    } else {
      const held = need.splice(0, 2);
      m.sequence = [
        ...shuffle([...need, ...others.slice(0, 34 - need.length)]),
        ...shuffle([...held, ...others.slice(34 - need.length)]),
      ];
      m.winCount = 34;
    }
  };

  let word: { guesses: string[]; streak: number; best: number } = {
    guesses: [],
    streak: 12,
    best: 21,
  };
  const ANSWER = "AREPA";
  const wordView = (): WordToday => {
    const solved = word.guesses.includes(ANSWER);
    const finished = solved || word.guesses.length >= 6;
    const midnight = new Date(
      `${new Date(Date.now() - 4 * 3_600_000).toISOString().slice(0, 10)}T04:00:00Z`,
    );
    midnight.setUTCDate(midnight.getUTCDate() + 1);
    return {
      date: new Date().toISOString().slice(0, 10),
      number: 42,
      hint: "Se rellena y se come a cualquier hora.",
      maxGuesses: 6,
      guesses: word.guesses.map((g) => ({
        word: g,
        result: evaluateGuess(g, ANSWER),
      })),
      solved,
      finished,
      answer: finished ? ANSWER : null,
      streak: { current: word.streak, best: word.best },
      nextAt: midnight.toISOString(),
      pointsPerWin: 5,
      streakBonuses: [
        { days: 7, points: 25 },
        { days: 30, points: 100 },
      ],
    };
  };
  const delay = <T>(v: T, ms = 220) =>
    new Promise<T>((r) => setTimeout(() => r(v), ms));

  return {
    getBodingo: () => delay(view(), 120),
    async buyBodingoCard(editionId, key) {
      await delay(null, 500);
      const replay = m.keys.get(key);
      if (replay) return { card: replay, replayed: true };
      if (m.edition.status !== "on_sale")
        throw new ClubApiError(
          "La venta de cartones de este Bodingo está cerrada.",
          409,
          "BODINGO_SALES_CLOSED",
        );
      if (m.cards.length >= 3)
        throw new ClubApiError(
          "Ya tienes 3 cartones, el máximo por Bodingo.",
          409,
          "BODINGO_MAX_CARDS",
        );
      if (wallet.balance() < m.edition.cardPricePoints) {
        throw new ClubApiError(
          "No tienes puntos disponibles suficientes para este cartón.",
          409,
          "BODINGO_INSUFFICIENT_POINTS",
        );
      }
      const card = randomCard((m.cards.at(-1)?.serial ?? 426) + 3 + rand(4));
      m.cards.push(card);
      m.keys.set(key, card);
      m.edition.players += 1;
      m.edition.cards += 1;
      wallet.move(
        -m.edition.cardPricePoints,
        "Compraste un cartón de Bodingo",
        `Cartón Nº ${String(card.serial).padStart(4, "0")}`,
      );
      void editionId;
      return { card, replayed: false };
    },
    async claimBodingo() {
      const v = view();
      if (!v.myWin || v.edition?.phase !== "claim")
        throw new ClubApiError(
          "Ya pasó el momento de cantar; el premio es tuyo igual.",
          409,
          "BODINGO_CLAIM_CLOSED",
        );
      m.claimed = true;
      return delay({ claimedAt: new Date().toISOString() }, 200);
    },
    getWord: () => delay(wordView()),
    async guessWord(raw) {
      const g = normalizeWord(raw);
      const before = wordView();
      if (before.finished)
        throw new ClubApiError(
          "Ya jugaste la palabra de hoy.",
          409,
          "WORD_GAME_FINISHED",
        );
      if (!/^[A-ZÑ]{5}$/.test(g))
        throw new ClubApiError(
          "La palabra tiene 5 letras.",
          400,
          "WORD_INVALID_GUESS",
        );
      if (!MOCK_WORDS.has(g))
        throw new ClubApiError(
          `"${g}" no está en nuestra lista. No pierdes el intento.`,
          400,
          "WORD_NOT_IN_DICTIONARY",
        );
      word = { ...word, guesses: [...word.guesses, g] };
      let awarded: WordGuessResult["awarded"] = null;
      if (g === ANSWER) {
        word.streak += 1;
        word.best = Math.max(word.best, word.streak);
        const bonus = [7, 30].includes(word.streak)
          ? { days: word.streak, points: word.streak === 7 ? 25 : 100 }
          : null;
        wallet.move(
          5 + (bonus?.points ?? 0),
          "Acertaste la Palabra del día",
          "Palabra del día #42",
        );
        awarded = { points: 5, bonus };
      } else if (word.guesses.length >= 6) {
        word.streak = 0;
      }
      return delay({ ...wordView(), awarded }, 260);
    },
    demo: {
      start,
      reset: () => {
        m = fresh();
        word = { guesses: [], streak: 12, best: 21 };
      },
    },
  };
}
