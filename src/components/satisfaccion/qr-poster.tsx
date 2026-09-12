"use client";

import { SurveyQR } from "./survey-qr";
import { SURVEY_URL } from "./survey-url";
import { BrandLogo } from "./brand-logo";
import { Button } from "@/components/ui/button";

// Etiqueta legible de la URL (sin https:// para el cartel).
const PRETTY_URL = SURVEY_URL.replace(/^https?:\/\//, "");

export function QrPoster() {
  return (
    <main className="relative z-[1] flex min-h-dvh w-full flex-col items-center justify-center gap-9 px-5 py-14">
      {/* Cartel imprimible (table-tent / sticker) */}
      <section className="lb-qr-poster flex w-full max-w-[420px] flex-col items-center gap-7 border border-hair-card bg-[color:var(--lb-grad-2)] px-10 py-11 text-center">
        <header className="flex flex-col items-center gap-3">
          <BrandLogo width={150} />
          <div className="pl-[0.36em] text-[12px] uppercase tracking-[0.36em] text-muted-ink">
            Restaurante · Panadería
          </div>
        </header>

        <div className="h-px w-full bg-hair-div" />

        <SurveyQR size={228} className="border border-hair-chip" />

        <div className="flex flex-col items-center gap-3">
          <h1 className="m-0 text-[34px] font-semibold uppercase leading-[0.95] tracking-[0.04em] text-cream">
            ¿Cómo estuvo
            <br />
            tu visita?
          </h1>
          <p className="m-0 max-w-[30ch] text-[16px] leading-[1.5] text-body">
            Apunta la cámara de tu teléfono al código. Dos minutos, seis
            preguntas.
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-1 pt-1">
          <div className="h-px w-full bg-hair-div" />
          <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-label">
            <span>Puerto Ordaz · Venezuela</span>
            <span>Encuesta de satisfacción</span>
          </div>
        </div>
      </section>

      {/* Controles — no se imprimen */}
      <div className="lb-no-print flex flex-col items-center gap-3">
        <Button variant="brand" size="brandMd" onClick={() => window.print()}>
          Imprimir
        </Button>
        <span className="font-serif text-[15px] italic text-muted-ink">
          {PRETTY_URL}
        </span>
      </div>
    </main>
  );
}
