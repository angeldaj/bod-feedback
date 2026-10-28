"use client";

import { useEffect, useState } from "react";
import { SurveyQR } from "@/components/satisfaccion/survey-qr";
import { BrandLogo } from "@/components/satisfaccion/brand-logo";
import { Button } from "@/components/ui/button";
import { REWARDS } from "./club-data";

// URL absoluta del club; `utm_source` distingue de qué pieza impresa llega cada registro.
const CLUB_URL = "https://labodega-ve.com/bodega-club";
const FLYER_URL = `${CLUB_URL}?utm_source=flyer&utm_medium=qr`;
const TICKET_URL = `${CLUB_URL}?utm_source=ticket&utm_medium=qr`;
const PRETTY_URL = CLUB_URL.replace(/^https?:\/\//, "");

type Piece = "flyer" | "ticket";

// Grabado guilloché del club teñido de oro (el SVG trae trazo negro, se usa como máscara).
const guilloche = {
  backgroundColor: "var(--lb-gold)",
  maskImage: "url(/club/guilloche.svg)",
  WebkitMaskImage: "url(/club/guilloche.svg)",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
} as const;

function Flyer() {
  const first = REWARDS[0];
  return (
    // A6 (105 × 148 mm): sale exacto al imprimir o guardar como PDF.
    <section className="lb-qr-poster lb-club-piece relative flex h-[148mm] w-[105mm] shrink-0 flex-col overflow-hidden border border-hair-card bg-[color:var(--lb-grad-2)] px-[9mm] pb-[7mm] pt-[8mm] text-cream">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[57%] size-[132mm] -translate-x-1/2 -translate-y-1/2 opacity-[0.16]"
        style={guilloche}
      />

      <header className="relative flex items-center justify-between">
        <BrandLogo width={72} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
          Bodega Club
        </span>
      </header>

      <div className="relative mt-[7mm]">
        <h1 className="m-0 text-[46px] font-semibold uppercase leading-[0.9] tracking-[0.01em]">
          Cada compra
          <br />
          <span className="text-gold">suma.</span>
        </h1>
        <p className="m-0 mt-3 max-w-[30ch] font-serif text-[17px] italic leading-[1.3] text-body">
          Únete gratis y cambia tus puntos por café, pan, postres y desayunos.
        </p>
      </div>

      <div className="relative mt-auto flex items-end gap-[5mm]">
        <SurveyQR value={FLYER_URL} size={150} className="shrink-0" />
        <ol className="m-0 flex list-none flex-col gap-2 p-0 pb-1 text-[15px] font-semibold uppercase leading-none tracking-[0.06em]">
          <li>Escanea</li>
          <li>Regístrate</li>
          <li className="text-gold">Suma y canjea</li>
        </ol>
      </div>

      <footer className="relative mt-[6mm] flex items-baseline justify-between gap-3 border-t border-hair-div pt-[3.5mm] text-[10.5px] uppercase tracking-[0.14em] text-label">
        <span>{PRETTY_URL}</span>
        <span className="text-muted-ink">
          {first.name} a los {first.points} pts
        </span>
      </footer>
    </section>
  );
}

function Ticket() {
  return (
    // 90 × 50 mm: el talón que acompaña al ticket de lotería.
    <section className="lb-qr-poster lb-club-piece relative flex h-[50mm] w-[90mm] shrink-0 items-center gap-[4mm] overflow-hidden border border-hair-card bg-[color:var(--lb-grad-2)] px-[4.5mm] text-cream">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[22mm] top-1/2 size-[80mm] -translate-y-1/2 opacity-[0.14]"
        style={guilloche}
      />
      <SurveyQR value={TICKET_URL} size={104} className="relative shrink-0" />
      <div className="relative flex min-w-0 flex-col gap-[2mm]">
        <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-gold">
          Bodega Club
        </span>
        <p className="m-0 text-[22px] font-semibold uppercase leading-[0.92]">
          Tu compra
          <br />
          también <span className="text-gold">suma</span>
        </p>
        <p className="m-0 font-serif text-[13px] italic leading-[1.2] text-body">
          Escanea y únete gratis.
        </p>
        <span className="text-[8px] uppercase tracking-[0.12em] text-label">
          {PRETTY_URL}
        </span>
      </div>
    </section>
  );
}

export function ClubQrPoster() {
  // Qué pieza sale en la impresión; null = ambas.
  const [only, setOnly] = useState<Piece | null>(null);

  useEffect(() => {
    const reset = () => setOnly(null);
    window.addEventListener("afterprint", reset);
    return () => window.removeEventListener("afterprint", reset);
  }, []);

  const print = (piece: Piece | null) => {
    setOnly(piece);
    // Deja que React pinte el atributo antes de abrir el diálogo.
    requestAnimationFrame(() => window.print());
  };

  return (
    <main
      data-print={only ?? "all"}
      className="lb-club-qr relative z-[1] flex min-h-dvh w-full flex-col items-center gap-10 overflow-x-auto px-4 py-12"
    >
      <div className="lb-club-sheet flex flex-wrap items-start justify-center gap-10">
        <div className="lb-club-flyer flex flex-col items-center gap-4">
          <Flyer />
          <Button
            className="lb-no-print"
            variant="brand"
            size="brandMd"
            onClick={() => print("flyer")}
          >
            Imprimir flyer
          </Button>
        </div>
        <div className="lb-club-ticket flex flex-col items-center gap-4">
          <Ticket />
          <Button
            className="lb-no-print"
            variant="brand"
            size="brandMd"
            onClick={() => print("ticket")}
          >
            Imprimir talón
          </Button>
        </div>
      </div>
      <p className="lb-no-print m-0 max-w-[52ch] text-center font-serif text-[15px] italic text-muted-ink">
        Para la imprenta, elige &ldquo;Guardar como PDF&rdquo; en el diálogo de
        impresión: el PDF sale vectorial y a tamaño real.
      </p>
    </main>
  );
}
