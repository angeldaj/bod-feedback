"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import {
  initialSurvey,
  STEPS,
  STEP_ANNOUNCE,
  type AspectKey,
  type StepName,
  type SurveyState,
} from "./survey-data";
import { shellContainer, shellItem, stepContainer, stepItem } from "./motion";
import {
  AspectsStep,
  ContactStep,
  DoneStep,
  IntroStep,
  IssuesStep,
  OverallStep,
  VisitStep,
  type StepActions,
} from "./steps";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./brand-logo";

function stepFromHash(): number {
  if (typeof window === "undefined") return 0;
  const hash = window.location.hash.replace("#", "") as StepName;
  const i = STEPS.indexOf(hash);
  return i === -1 ? 0 : i;
}

export function SurveyExperience() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [state, setState] = useState<SurveyState>(initialSurvey);
  const [height, setHeight] = useState<number | "auto">("auto");

  const contentRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Deep-link: #overall, #aspects, … abre/comparte un paso concreto.
  useEffect(() => {
    setStep(stepFromHash());
  }, []);

  // Morph de altura de la tarjeta al cambiar de paso.
  // Callback ref: AnimatePresence mode="wait" desmonta el paso anterior antes
  // de montar el nuevo, así que medimos y observamos siempre el elemento vivo.
  // (Un ResizeObserver que capturara el elemento anterior mediría 0 al salir.)
  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }
    contentRef.current = node;
    if (!node) return;
    setHeight(node.offsetHeight);
    const ro = new ResizeObserver(() => {
      if (contentRef.current) setHeight(contentRef.current.offsetHeight);
    });
    ro.observe(node);
    roRef.current = ro;
  }, []);

  useEffect(() => () => roRef.current?.disconnect(), []);

  const name = STEPS[step];

  // Anuncio para lectores de pantalla.
  useEffect(() => {
    if (announceRef.current) announceRef.current.textContent = STEP_ANNOUNCE[name];
  }, [name]);

  const goto = useCallback(
    (delta: number) => {
      setStep((s) => {
        const target = Math.min(STEPS.length - 1, Math.max(0, s + delta));
        if (target !== s) setDir(delta >= 0 ? 1 : -1);
        return target;
      });
      try {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
    },
    [reduce],
  );

  const actions: StepActions = {
    next: () => goto(1),
    back: () => goto(-1),
    restart: () => {
      setState(initialSurvey);
      setDir(-1);
      setStep(0);
      try {
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } catch {
        window.scrollTo(0, 0);
      }
    },
    setOverall: (n) => setState((s) => ({ ...s, overall: n })),
    setSucursal: (v) => setState((s) => ({ ...s, sucursal: v })),
    setMomento: (v) => setState((s) => ({ ...s, momento: v })),
    setAspect: (key: AspectKey, n) =>
      setState((s) => ({ ...s, aspects: { ...s.aspects, [key]: n } })),
    toggleTema: (label) =>
      setState((s) => ({
        ...s,
        temas: s.temas.includes(label)
          ? s.temas.filter((t) => t !== label)
          : [...s.temas, label],
      })),
    setField: (key, v) => setState((s) => ({ ...s, [key]: v })),
  };

  const pct = Math.round((Math.min(step, 5) / 5) * 100);
  const stepLabel = name === "done" ? "Completado" : `Paso ${Math.max(1, step)} de 5`;
  const showNav = step >= 1 && step <= 5;
  const nextLabel = name === "contact" ? "Enviar" : "Siguiente";

  function renderStep() {
    switch (name) {
      case "intro":
        return <IntroStep actions={actions} />;
      case "overall":
        return <OverallStep state={state} actions={actions} />;
      case "visit":
        return <VisitStep state={state} actions={actions} />;
      case "aspects":
        return <AspectsStep state={state} actions={actions} />;
      case "issues":
        return <IssuesStep state={state} actions={actions} />;
      case "contact":
        return <ContactStep state={state} actions={actions} />;
      case "done":
        return <DoneStep actions={actions} />;
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative z-[1] flex w-full flex-col items-center px-5 pt-10 pb-16 max-[560px]:px-3.5 max-[560px]:pt-7 max-[560px]:pb-10">
        <motion.div
          variants={shellContainer}
          initial="hidden"
          animate="enter"
          className="flex w-full max-w-[760px] flex-col items-center"
        >
          {/* Brand lockup */}
          <motion.header
            variants={shellItem}
            className="flex w-full flex-col items-center gap-3"
          >
            <BrandLogo width={150} />
            <div className="pl-[0.36em] text-[12px] uppercase tracking-[0.36em] text-muted-ink">
              Restaurante · Panadería
            </div>
          </motion.header>

          {/* Progress */}
          <motion.div
            variants={shellItem}
            className="mt-[34px] flex w-full items-center gap-4"
          >
            <div className="relative h-px flex-1 overflow-hidden bg-hair-track">
              <div
                className="lb-fill"
                style={{ width: `${pct}%` }}
                data-advancing={dir === 1}
              />
            </div>
            <div className="text-[12px] whitespace-nowrap uppercase tracking-[0.3em] text-muted-ink">
              {stepLabel}
            </div>
          </motion.div>

          {/* Card */}
          <motion.section
            variants={shellItem}
            className="relative mt-[38px] w-full border-y border-hair-card bg-card px-11 pt-11 pb-10 max-[560px]:px-5 max-[560px]:pt-7 max-[560px]:pb-[26px]"
          >
            {/* hairlines que se dibujan desde el centro */}
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 -top-px h-px origin-center bg-gold opacity-55"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            />
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 -bottom-px h-px origin-center bg-gold opacity-55"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            />

            <motion.div
              className="overflow-hidden"
              animate={{ height }}
              transition={reduce ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={name}
                  ref={setContentRef}
                  variants={stepContainer}
                  initial="hidden"
                  animate="enter"
                  exit="leaving"
                  className="flex flex-col gap-7"
                >
                  {renderStep()}

                  {showNav && (
                    <motion.div
                      variants={stepItem}
                      className="mt-1.5 flex flex-wrap items-center justify-between gap-4 border-t border-hair-div pt-6"
                    >
                      <Button variant="brandGhost" size="brandGhost" onClick={actions.back}>
                        Atrás
                      </Button>
                      <Button variant="brand" size="brandMd" onClick={actions.next}>
                        {nextLabel}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.section>

          {/* Footer */}
          <motion.footer
            variants={shellItem}
            className="mt-[26px] flex w-full flex-wrap items-center justify-between gap-4 text-[14px] uppercase tracking-[0.16em] text-label"
          >
            <span>Puerto Ordaz · Venezuela</span>
            <span>Encuesta de satisfacción</span>
          </motion.footer>
        </motion.div>
      </main>

      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        className="sr-only"
      />
    </MotionConfig>
  );
}
