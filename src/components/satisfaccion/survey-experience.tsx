"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import {
  initialSurvey,
  STEPS,
  STEP_ANNOUNCE,
  type AspectKey,
  type StepName,
  type SurveyState,
} from "./survey-data";
import { shellContainer, shellItem, popStepContainer, popStepItem } from "./motion";
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
import { PopScene } from "@/components/pop-scene";
import { submitSurvey } from "@/lib/feedback-api";

function stepFromHash(): number {
  if (typeof window === "undefined") return 0;
  const hash = window.location.hash.replace("#", "") as StepName;
  const i = STEPS.indexOf(hash);
  return i === -1 ? 0 : i;
}

export function SurveyExperience({
  embedded = false,
  onUrgent,
}: {
  /** Rendered inside the /feedback tab shell: drops its own page chrome
   *  (main wrapper, background glow, brand header, page footer). */
  embedded?: boolean;
  /** When embedded, the "algo urgente" nudge switches tabs instead of navigating. */
  onUrgent?: () => void;
} = {}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [state, setState] = useState<SurveyState>(initialSurvey);
  const [height, setHeight] = useState<number | "auto">("auto");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Deep-link: #overall, #aspects, … abre/comparte un paso concreto.
  useEffect(() => {
    setStep(stepFromHash());
  }, []);

  // Morph de altura de la tarjeta al cambiar de paso.
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

  useEffect(() => {
    if (announceRef.current) announceRef.current.textContent = STEP_ANNOUNCE[name];
  }, [name]);

  // Standalone (full-page) the survey resets scroll on each step so the card
  // top is in view. Embedded in the /feedback split the survey is only part of
  // the page, so we keep the reader's scroll position instead of yanking to top.
  const resetScroll = useCallback(() => {
    if (embedded) return;
    try {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [embedded, reduce]);

  const goto = useCallback(
    (delta: number) => {
      setStep((s) => {
        const target = Math.min(STEPS.length - 1, Math.max(0, s + delta));
        if (target !== s) setDir(delta >= 0 ? 1 : -1);
        return target;
      });
      resetScroll();
    },
    [resetScroll],
  );

  const actions: StepActions = {
    next: () => goto(1),
    back: () => goto(-1),
    restart: () => {
      setState(initialSurvey);
      setDir(-1);
      setStep(0);
      setError(null);
      resetScroll();
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

  // En el paso de contacto, "Enviar" manda la encuesta al backend antes de
  // pasar a la pantalla de gracias. En el resto, solo avanza.
  async function handleNext() {
    if (name !== "contact") {
      goto(1);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await submitSurvey(state);
      goto(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos enviar tu encuesta. Intenta de nuevo.",
      );
    } finally {
      setSending(false);
    }
  }

  const pct = Math.round((Math.min(step, 5) / 5) * 100);
  const stepLabel = name === "done" ? "¡Listo!" : `Paso ${Math.max(1, step)} de 5`;
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

  const urgentCta =
    embedded && onUrgent ? (
      <button
        type="button"
        onClick={onUrgent}
        className="group inline-flex items-center gap-2 rounded-full border border-[rgba(255,106,61,0.4)] bg-[rgba(255,106,61,0.1)] px-4 py-2 text-[13px] font-semibold text-coral transition-colors hover:border-coral hover:bg-[rgba(255,106,61,0.18)]"
      >
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-coral shadow-[0_0_8px_2px_rgba(255,106,61,0.7)]"
        />
        ¿Tienes una queja? Cuéntanosla aquí
      </button>
    ) : (
      <Link
        href="/reportar"
        className="group inline-flex items-center gap-2 rounded-full border border-[rgba(255,106,61,0.4)] bg-[rgba(255,106,61,0.1)] px-4 py-2 text-[13px] font-semibold text-coral transition-colors hover:border-coral hover:bg-[rgba(255,106,61,0.18)]"
      >
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-coral shadow-[0_0_8px_2px_rgba(255,106,61,0.7)]"
        />
        ¿Tienes una queja? Cuéntanosla aquí
      </Link>
    );

  const body = (
    <motion.div
      variants={shellContainer}
      initial="hidden"
      animate="enter"
      className="relative z-[1] flex w-full flex-col items-center"
    >
      {/* Brand lockup — only when standalone; the /feedback shell owns it. */}
      {!embedded && (
        <motion.header
          variants={shellItem}
          className="flex w-full flex-col items-center gap-3"
        >
          <BrandLogo width={132} />
          <div className="pl-[0.28em] text-[11px] font-medium uppercase tracking-[0.28em] text-muted-ink">
            Restaurante · Panadería
          </div>
        </motion.header>
      )}

      {/* Progress */}
      <motion.div
        variants={shellItem}
        className={
          (embedded ? "" : "mt-7 ") + "flex w-full items-center gap-4"
        }
      >
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--lb-hair-track)]">
          <div className="pop-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[12px] font-medium whitespace-nowrap uppercase tracking-[0.2em] text-muted-ink">
          {stepLabel}
        </div>
      </motion.div>

      {/* Card */}
      <motion.section
        variants={shellItem}
        className="pop-card relative mt-6 w-full px-9 pt-9 pb-8 max-[560px]:px-5 max-[560px]:pt-7 max-[560px]:pb-6"
      >
        <motion.div
          className="overflow-hidden"
          animate={{ height }}
          transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={name}
              ref={setContentRef}
              variants={popStepContainer}
              initial="hidden"
              animate="enter"
              exit="leaving"
              className="flex flex-col gap-6"
            >
              {renderStep()}

              {error && (
                <p role="alert" className="mt-4 text-[13px] font-medium text-coral">
                  {error}
                </p>
              )}

              {showNav && (
                <motion.div
                  variants={popStepItem}
                  className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-hair-div pt-6"
                >
                  <Button variant="popGhost" size="popMd" onClick={actions.back} className="gap-2" disabled={sending}>
                    <ArrowLeft aria-hidden="true" />
                    Atrás
                  </Button>
                  <Button
                    variant="pop"
                    size="popMd"
                    onClick={handleNext}
                    disabled={sending}
                    className="gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Enviando…" : nextLabel}
                    {name === "contact" ? (
                      <Send aria-hidden="true" />
                    ) : (
                      <ArrowRight aria-hidden="true" />
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.section>

      {/* Footer + urgent link */}
      <motion.footer
        variants={shellItem}
        className="mt-6 flex w-full flex-col items-center gap-3 text-center"
      >
        {urgentCta}
        {!embedded && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] uppercase tracking-[0.12em] text-label">
            <span>Puerto Ordaz · Venezuela</span>
          </div>
        )}
      </motion.footer>
    </motion.div>
  );

  return (
    <MotionConfig reducedMotion="user">
      {embedded ? (
        body
      ) : (
        <main className="relative z-[1] flex w-full flex-col items-center px-5 pt-9 pb-16 max-[560px]:px-3.5 max-[560px]:pt-6 max-[560px]:pb-10">
          <div className="relative w-full max-w-[720px]">
            <PopScene tone="warm" />
            {body}
          </div>
        </main>
      )}

      <div ref={announceRef} role="status" aria-live="polite" className="sr-only" />
    </MotionConfig>
  );
}
