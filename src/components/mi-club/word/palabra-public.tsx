"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMember } from "@/lib/member-session";
import { createLiveGames } from "@/lib/games-api";
import { WordGame, type WordSource } from "./word-game";
import "../palabra.css";

/**
 * `/palabra`: el destino del enlace compartido. Con sesión del club juega
 * como socio (suma puntos); sin sesión, como invitado.
 */
export function PalabraPublic() {
  const { member, loading, authedRequest } = useMember();
  const source = useMemo<WordSource>(
    () =>
      member
        ? { kind: "member", api: createLiveGames(authedRequest) }
        : { kind: "guest" },
    [member, authedRequest],
  );
  const [toast, setToast] = useState<{ title: string; sub: string } | null>(
    null,
  );
  const timer = useRef<number | undefined>(undefined);
  const notify = useCallback((title: string, sub: string) => {
    setToast({ title, sub });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 3600);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <main className="pw-page">
      <header className="pw-page-top">
        <Link href="/" aria-label="La Bodega, inicio">
          <Image src="/logo-bodega.png" alt="" width={36} height={36} />
        </Link>
        <span>Bodega Club</span>
        {member ? (
          <Link href="/mi-club" className="pw-link">
            Mi club
          </Link>
        ) : (
          <Link href="/login" className="pw-link">
            Entrar
          </Link>
        )}
      </header>
      {loading ? (
        <div className="pw-skeleton" aria-busy="true" />
      ) : (
        <WordGame key={member?.id ?? "guest"} source={source} notify={notify} />
      )}
      {toast ? (
        <div className="pw-toast" role="status">
          <b>{toast.title}</b>
          <span>{toast.sub}</span>
        </div>
      ) : null}
    </main>
  );
}
