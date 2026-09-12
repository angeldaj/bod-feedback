"use client";

import { AnimatePresence, motion } from "motion/react";
import { stepItem } from "./motion";
import { RatingScale } from "./rating-scale";
import { ChipGroup } from "./chip-group";
import { BrandTextField, BrandTextArea } from "./brand-field";
import { SurveyQR } from "./survey-qr";
import { Button } from "@/components/ui/button";
import {
  ASPECTS,
  MOMENTOS,
  OVERALL_LABELS,
  SUCURSALES,
  TEMAS,
  type AspectKey,
  type SurveyState,
} from "./survey-data";

// ---- Shared typographic blocks ----
const cls = {
  eyebrow: "text-[12px] uppercase tracking-[0.36em] text-muted-ink",
  eyebrowSerif: "font-serif italic text-[24px] text-gold-accent",
  title:
    "m-0 text-[42px] font-semibold uppercase leading-none tracking-[0.04em] max-[560px]:text-[34px]",
  headline:
    "m-0 text-[58px] font-semibold uppercase leading-[0.92] tracking-[0.04em] text-balance max-[560px]:text-[clamp(40px,12vw,58px)]",
  body: "text-[19px] leading-[1.5] text-body max-w-[52ch] text-pretty",
  groupLabel: "text-[13px] uppercase tracking-[0.28em] text-label",
};

function Item({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={stepItem} className={className}>
      {children}
    </motion.div>
  );
}

export type StepActions = {
  next: () => void;
  back: () => void;
  restart: () => void;
  setOverall: (n: number) => void;
  setSucursal: (v: string) => void;
  setMomento: (v: string) => void;
  setAspect: (key: AspectKey, n: number) => void;
  toggleTema: (label: string) => void;
  setField: (key: "comentario" | "nombre" | "contacto", v: string) => void;
};

// ---- Step 0: Intro ----
export function IntroStep({ actions }: { actions: StepActions }) {
  return (
    <>
      <Item className={cls.eyebrowSerif}>Gracias por acompañarnos</Item>
      <Item>
        <h1 className={cls.headline}>
          ¿Cómo estuvo
          <br />
          tu visita?
        </h1>
      </Item>
      <Item>
        <p className={cls.body}>
          Seis preguntas, menos de dos minutos. Lo que nos cuentes lo lee el
          equipo de sala y cocina cada semana.
        </p>
      </Item>
      <Item className="mt-1.5 flex flex-wrap items-center gap-[18px]">
        <Button variant="brand" size="brandLg" onClick={actions.next}>
          Comenzar
        </Button>
        <span className="font-serif text-[18px] italic text-muted-ink">
          Anónimo si así lo prefieres
        </span>
      </Item>
      <Item className="mt-1.5 flex flex-wrap items-center gap-5 border-t border-hair-div pt-6">
        <SurveyQR size={104} />
        <div className="flex flex-col gap-1">
          <span className="text-[13px] uppercase tracking-[0.28em] text-label">
            ¿Prefieres tu teléfono?
          </span>
          <span className="font-serif text-[19px] italic text-muted-ink">
            Escanea el código para abrir la encuesta.
          </span>
        </div>
      </Item>
    </>
  );
}

// ---- Step 1: Satisfacción general ----
export function OverallStep({
  state,
  actions,
}: {
  state: SurveyState;
  actions: StepActions;
}) {
  return (
    <>
      <Item className={cls.eyebrow}>Paso uno</Item>
      <Item>
        <h2 className={cls.title}>Satisfacción general</h2>
      </Item>
      <Item>
        <RatingScale
          variant="overall"
          value={state.overall}
          onChange={actions.setOverall}
          ariaLabel="Satisfacción general, de 1 a 5"
        />
      </Item>
      <Item className="flex max-w-[492px] justify-between text-[13px] uppercase tracking-[0.2em] text-label">
        <span>Mala</span>
        <span>Excelente</span>
      </Item>
      <Item className="min-h-[1.4em] font-serif text-[22px] italic text-gold-accent">
        <AnimatePresence mode="wait">
          <motion.span
            key={state.overall}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {OVERALL_LABELS[state.overall] ?? " "}
          </motion.span>
        </AnimatePresence>
      </Item>
    </>
  );
}

// ---- Step 2: Tu visita ----
export function VisitStep({
  state,
  actions,
}: {
  state: SurveyState;
  actions: StepActions;
}) {
  return (
    <>
      <Item className={cls.eyebrow}>Paso dos</Item>
      <Item>
        <h2 className={cls.title}>Tu visita</h2>
      </Item>
      <Item className="flex flex-col gap-3">
        <div className={cls.groupLabel}>Sucursal</div>
        <ChipGroup
          variant="branch"
          ariaLabel="Sucursal"
          options={SUCURSALES}
          value={state.sucursal}
          onSelect={actions.setSucursal}
        />
      </Item>
      <Item className="flex flex-col gap-3">
        <div className={cls.groupLabel}>Momento</div>
        <ChipGroup
          variant="branch"
          ariaLabel="Momento"
          options={MOMENTOS}
          value={state.momento}
          onSelect={actions.setMomento}
        />
      </Item>
    </>
  );
}

// ---- Step 3: Lo que evaluamos ----
export function AspectsStep({
  state,
  actions,
}: {
  state: SurveyState;
  actions: StepActions;
}) {
  return (
    <>
      <Item className={cls.eyebrow}>Paso tres</Item>
      <Item>
        <h2 className={cls.title}>Lo que evaluamos</h2>
      </Item>
      <Item className="flex flex-col">
        {ASPECTS.map((a) => (
          <div
            key={a.key}
            className="flex flex-wrap items-center justify-between gap-5 border-t border-hair-div py-[18px] max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-3"
          >
            <div>
              <div className="text-[22px] font-semibold uppercase tracking-[0.1em]">
                {a.label}
              </div>
              <div className="font-serif text-[17px] italic text-muted-ink">
                {a.hint}
              </div>
            </div>
            <RatingScale
              variant="dots"
              value={state.aspects[a.key]}
              onChange={(n) => actions.setAspect(a.key, n)}
              ariaLabel={`${a.label}, de 1 a 5`}
            />
          </div>
        ))}
      </Item>
    </>
  );
}

// ---- Step 4: ¿Algo que mejorar? ----
export function IssuesStep({
  state,
  actions,
}: {
  state: SurveyState;
  actions: StepActions;
}) {
  return (
    <>
      <Item className={cls.eyebrow}>Paso cuatro</Item>
      <Item>
        <h2 className={cls.title}>¿Algo que mejorar?</h2>
      </Item>
      <Item>
        <ChipGroup
          variant="topic"
          multi
          ariaLabel="Temas a mejorar"
          options={TEMAS}
          value={state.temas}
          onSelect={actions.toggleTema}
        />
      </Item>
      <Item>
        <BrandTextArea
          label="Cuéntanos con tus palabras"
          value={state.comentario}
          onChange={(v) => actions.setField("comentario", v)}
          placeholder="Lo que pasó, lo que te gustó, lo que esperabas…"
        />
      </Item>
    </>
  );
}

// ---- Step 5: ¿Te contactamos? ----
export function ContactStep({
  state,
  actions,
}: {
  state: SurveyState;
  actions: StepActions;
}) {
  return (
    <>
      <Item className={cls.eyebrow}>Paso cinco</Item>
      <Item>
        <h2 className={cls.title}>¿Te contactamos?</h2>
      </Item>
      <Item>
        <p className="text-[18px] leading-[1.5] text-body">
          Opcional. Si dejas tus datos, un encargado te escribe personalmente.
        </p>
      </Item>
      <Item className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px]">
        <BrandTextField
          label="Nombre"
          autoComplete="name"
          placeholder="Tu nombre"
          value={state.nombre}
          onChange={(v) => actions.setField("nombre", v)}
        />
        <BrandTextField
          label="Teléfono o correo"
          autoComplete="email"
          placeholder="+58 ··· / tu@correo"
          value={state.contacto}
          onChange={(v) => actions.setField("contacto", v)}
        />
      </Item>
    </>
  );
}

// ---- Step 6: Gracias ----
export function DoneStep({ actions }: { actions: StepActions }) {
  return (
    <Item className="flex flex-col items-center gap-5 py-[20px] pb-2.5 text-center">
      <div className="relative flex h-[66px] w-[66px] items-center justify-center">
        <span
          className="lb-seal-ring absolute inset-0 border border-gold opacity-0"
          aria-hidden="true"
        />
        <span className="flex h-[66px] w-[66px] items-center justify-center border border-gold font-serif text-[34px] text-gold">
          B
        </span>
      </div>
      <div className="text-[50px] font-semibold uppercase leading-[0.95] tracking-[0.04em]">
        Gracias
      </div>
      <div className={cls.eyebrowSerif}>Tu opinión ya está con el equipo</div>
      <p className="max-w-[46ch] text-[18px] leading-[1.5] text-body">
        Si dejaste tus datos, te escribimos en las próximas 48 horas.
      </p>
      <Button
        variant="brandGhost"
        size="brandGhost"
        onClick={actions.restart}
        className="mt-2 border-[rgba(217,169,74,0.6)] text-gold-accent"
      >
        Enviar otra respuesta
      </Button>
    </Item>
  );
}
