"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Armchair,
  Clock,
  HandPlatter,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { popStepItem } from "./motion";
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

// ---- Shared typographic blocks (pop register) ----
const cls = {
  eyebrow: "text-[12px] font-semibold uppercase tracking-[0.2em] text-coral",
  eyebrowSerif: "font-serif italic text-[22px] text-gold-accent",
  title:
    "m-0 text-[40px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream text-balance max-[560px]:text-[32px]",
  headline:
    "m-0 text-[54px] font-semibold uppercase leading-[0.9] tracking-[0.01em] text-balance text-cream max-[560px]:text-[clamp(38px,11vw,54px)]",
  body: "text-[18px] leading-[1.55] text-body max-w-[52ch] text-pretty",
  groupLabel: "text-[13px] font-medium uppercase tracking-[0.14em] text-label",
};

// Un icono por aspecto evaluado (deleite y lectura rápida).
const ASPECT_ICON: Record<AspectKey, LucideIcon> = {
  comida: UtensilsCrossed,
  servicio: HandPlatter,
  ambiente: Armchair,
  tiempo: Clock,
};

// Color del texto de reacción, ligado a la nota. Tonos profundos que leen
// sobre la crema del tema de día (y siguen legibles sobre oscuro).
const SENT_TEXT: Record<number, string> = {
  1: "#c8391a",
  2: "#cf4a1c",
  3: "#b57611",
  4: "#a9761a",
  5: "#b0710f",
};

function Item({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={popStepItem} className={className}>
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
          En La Bodega queremos atenderte con el mayor estándar. Cuéntanos cómo
          te fue: te toma menos de dos minutos y nos ayuda a cuidarte aún mejor
          en tu próxima visita.
        </p>
      </Item>
      <Item className="mt-1 flex flex-wrap items-center gap-4">
        <Button variant="pop" size="popLg" onClick={actions.next} className="gap-2">
          Comenzar
          <ArrowRight aria-hidden="true" />
        </Button>
        <span className="font-serif text-[18px] italic text-muted-ink">
          Anónimo si así lo prefieres
        </span>
      </Item>
      <Item className="mt-1 flex flex-wrap items-center gap-5 border-t border-hair-div pt-6">
        <div className="overflow-hidden rounded-2xl">
          <SurveyQR size={98} />
        </div>
        <div className="flex flex-col gap-1">
          <span className={cls.groupLabel}>¿Prefieres tu teléfono?</span>
          <span className="font-serif text-[18px] italic text-muted-ink">
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
      <Item className="flex max-w-[430px] justify-between text-[13px] font-medium uppercase tracking-[0.12em] text-label">
        <span>Mala</span>
        <span>Excelente</span>
      </Item>
      <Item className="min-h-[1.5em] font-serif text-[22px] italic">
        <AnimatePresence mode="wait">
          <motion.span
            key={state.overall}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            style={{ color: SENT_TEXT[state.overall] ?? "var(--lb-gold-accent)" }}
          >
            {OVERALL_LABELS[state.overall] ?? " "}
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
      <Item className="flex flex-col gap-1">
        {ASPECTS.map((a) => {
          const Icon = ASPECT_ICON[a.key];
          return (
            <div
              key={a.key}
              className="flex flex-wrap items-center justify-between gap-4 border-t border-hair-div py-4 first:border-t-0 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-2.5"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--lb-input)] text-gold-accent">
                  <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <div>
                  <div className="text-[21px] font-semibold uppercase tracking-[0.02em] text-cream">
                    {a.label}
                  </div>
                  <div className="font-serif text-[16px] italic text-muted-ink">
                    {a.hint}
                  </div>
                </div>
              </div>
              <RatingScale
                variant="dots"
                value={state.aspects[a.key]}
                onChange={(n) => actions.setAspect(a.key, n)}
                ariaLabel={`${a.label}, de 1 a 5`}
              />
            </div>
          );
        })}
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
  const lowScore = state.overall > 0 && state.overall <= 2;
  return (
    <>
      <Item className={cls.eyebrow}>Paso cuatro</Item>
      <Item>
        <h2 className={cls.title}>¿Algo que mejorar?</h2>
      </Item>

      {lowScore && (
        <Item>
          <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(255,106,61,0.4)] bg-[rgba(255,106,61,0.1)] p-4">
            <div className="flex items-center gap-2">
              <span className="pop-badge pop-badge-coral text-[12px] uppercase tracking-[0.06em]">
                Queja
              </span>
              <span className="text-[15px] font-semibold text-cream">
                ¿Algo no estuvo bien?
              </span>
            </div>
            <p className="text-[15px] leading-[1.5] text-body">
              Si encontraste comida en mal estado, fría, cruda o un objeto
              extraño, no hace falta que llenes toda la encuesta: repórtalo con
              una foto y lo resolvemos de inmediato para ti.
            </p>
            <div>
              <Button
                variant="popCoral"
                size="popSm"
                render={<Link href="/feedback?tab=urgente" />}
              >
                Reportar mi queja
              </Button>
            </div>
          </div>
        </Item>
      )}

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
      <Item className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
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
          inputMode="email"
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
    <Item className="flex flex-col items-center gap-5 py-5 pb-2 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 18 }}
        className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, var(--lb-gold-hi), var(--lb-coral))",
        }}
      >
        <span className="flex h-[74px] w-[74px] items-center justify-center font-serif text-[36px] text-[#2a0f07]">
          B
        </span>
      </motion.div>
      <div className="text-[48px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream">
        ¡Gracias!
      </div>
      <div className={cls.eyebrowSerif}>Tu opinión ya está con el equipo</div>
      <p className="max-w-[46ch] text-[17px] leading-[1.5] text-body">
        Si dejaste tus datos, te escribimos en las próximas 48 horas.
      </p>
      <Button
        variant="popGhost"
        size="popMd"
        onClick={actions.restart}
        className="mt-1"
      >
        Enviar otra respuesta
      </Button>
    </Item>
  );
}
