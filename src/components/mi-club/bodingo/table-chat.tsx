"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, SendHorizontal, Wheat, X } from "lucide-react";
import {
  CHAT_MAX_LENGTH,
  type BodingoChat,
  type BodingoChatMessage,
  type GamesApi,
} from "@/lib/games-api";

const BLOCK_TEXT: Record<NonNullable<BodingoChat["block"]>, string> = {
  closed: "El chat abre con la venta de cartones y cierra al cantar Bodingo.",
  no_card: "Compra un cartón para escribir en la mesa. Mientras, puedes leer.",
  muted: "El equipo pausó tus mensajes en esta mesa.",
};

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-VE", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Caracas",
  });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * Chat en vivo de la mesa (spec 154). Consulta cada pocos segundos, como el
 * juego. En escritorio va fijo en la columna; en el teléfono es una hoja que
 * se abre con el botón flotante.
 */
const PHONE = "(max-width: 1023.98px)";
const subscribePhone = (cb: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function TableChat({
  games,
  live,
  players,
  themeClass,
}: {
  games: GamesApi;
  live: boolean;
  players: number;
  /** Clases del Bodingo (tema y fuentes) para la hoja, que se monta fuera. */
  themeClass: string;
}) {
  const phone = useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false);
  const [chat, setChat] = useState<BodingoChat | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpenState] = useState(false);
  const [seen, setSeen] = useState<string | null>(null);
  // Abierta (o en escritorio, donde siempre se ve) cuenta como leída.
  const reading = useRef(false);
  const listRef = useRef<HTMLOListElement>(null);
  const stick = useRef(true);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    const load = async () => {
      if (!document.hidden) {
        try {
          const next = await games.getBodingoChat();
          if (alive) {
            setChat(next);
            if (reading.current || window.matchMedia("(min-width: 1024px)").matches)
              setSeen(next.messages.at(-1)?.id ?? null);
          }
        } catch {
          // Se reintenta en la próxima vuelta.
        }
      }
      if (alive) timer = window.setTimeout(load, live ? 3_000 : 8_000);
    };
    void load();
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [games, live]);

  const messages = chat?.messages ?? [];
  const lastId = messages.at(-1)?.id ?? null;

  // Baja al último mensaje si ya estaba abajo (no le roba el scroll a quien lee arriba).
  useEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [lastId, open]);

  const setOpen = (value: boolean) => {
    reading.current = value;
    setOpenState(value);
    setSeen(lastId);
  };

  const unseenFrom = seen ? messages.findIndex((m) => m.id === seen) + 1 : 0;
  const unread = messages.slice(unseenFrom).filter((m) => !m.mine).length;

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const message = await games.sendBodingoChat(body);
      setText("");
      stick.current = true;
      setChat((c) =>
        c
          ? { ...c, messages: [...c.messages.filter((m) => m.id !== message.id), message].slice(-50) }
          : c,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };

  const block = chat?.block ?? null;
  // En el teléfono la hoja se monta en <body>: dentro de la página, la barra inferior la tapa.
  const mount = (node: ReactNode) =>
    phone ? createPortal(<div className={`bdg-portal ${themeClass}`}>{node}</div>, document.body) : node;
  return mount(
    <>
      <button
        type="button"
        className="bdg-chat-fab"
        onClick={() => setOpen(true)}
        aria-label={unread ? `Abrir el chat de la mesa, ${unread} mensajes nuevos` : "Abrir el chat de la mesa"}
      >
        <MessageCircle aria-hidden="true" />
        <span>Mesa</span>
        {unread && !open ? <b className="num">{unread > 9 ? "9+" : unread}</b> : null}
      </button>

      <section
        className="bdg-chat"
        data-open={open || undefined}
        aria-labelledby="bdg-chat-h"
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        <header className="bdg-chat-h">
          <Wheat aria-hidden="true" className="wheat" />
          <div>
            <h2 id="bdg-chat-h">La mesa</h2>
            <small>
              {live ? <i className="dot" aria-hidden="true" /> : null}
              <span className="num">{players}</span> {players === 1 ? "jugador" : "jugadores"}
            </small>
          </div>
          <button type="button" className="bdg-chat-close" onClick={() => setOpen(false)} aria-label="Cerrar el chat">
            <X aria-hidden="true" />
          </button>
        </header>

        <ol
          ref={listRef}
          className="bdg-chat-list"
          aria-live="polite"
          aria-relevant="additions"
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
          }}
        >
          {!chat ? (
            <li className="bdg-chat-empty">Cargando la mesa…</li>
          ) : messages.length ? (
            messages.map((m, i) => <Bubble key={m.id} m={m} grouped={messages[i - 1]?.nameShown === m.nameShown && messages[i - 1]?.mine === m.mine} />)
          ) : (
            <li className="bdg-chat-empty">
              <Wheat aria-hidden="true" />
              Nadie ha escrito todavía. ¡Saluda a la mesa!
            </li>
          )}
        </ol>

        {block ? (
          <p className="bdg-chat-block">{BLOCK_TEXT[block]}</p>
        ) : (
          <form className="bdg-chat-form" onSubmit={(e) => void send(e)}>
            <label htmlFor="bdg-chat-in" className="sr">
              Mensaje para la mesa
            </label>
            <input
              id="bdg-chat-in"
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, CHAT_MAX_LENGTH));
                setError(null);
              }}
              placeholder="Escribe a la mesa…"
              maxLength={CHAT_MAX_LENGTH}
              autoComplete="off"
              enterKeyHint="send"
              aria-describedby="bdg-chat-msg"
            />
            <button type="submit" disabled={!text.trim() || sending} aria-label="Enviar">
              <SendHorizontal aria-hidden="true" />
            </button>
            <p id="bdg-chat-msg" className="bdg-chat-msg" aria-live="polite">
              {error ?? (text.length > CHAT_MAX_LENGTH - 30 ? `${CHAT_MAX_LENGTH - text.length} caracteres` : "")}
            </p>
          </form>
        )}
      </section>
      {open ? <div className="bdg-chat-scrim" onClick={() => setOpen(false)} aria-hidden="true" /> : null}
    </>,
  );
}

function Bubble({ m, grouped }: { m: BodingoChatMessage; grouped: boolean }) {
  return (
    <li className={`bdg-bubble${m.mine ? " mine" : ""}${grouped ? " grouped" : ""}`}>
      {m.mine ? null : grouped ? (
        <span className="av ghost" aria-hidden="true" />
      ) : m.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar externo (Cloudinary), tamaño fijo
        <img className="av" src={m.avatarUrl} alt="" width={30} height={30} />
      ) : (
        <span className="av" aria-hidden="true">
          {initials(m.nameShown)}
        </span>
      )}
      <div className="b">
        {grouped || m.mine ? <span className="sr">{m.mine ? "Tú" : m.nameShown}: </span> : <b>{m.nameShown}</b>}
        <p>{m.body}</p>
        <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
      </div>
    </li>
  );
}
