"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, LoaderCircle, Send } from "lucide-react";
import {
  FIELD_ERRORS,
  initialSurvey,
  isDetractor,
  missingFields,
  NUM_STEPS,
  STEPS,
  STEP_ANNOUNCE,
  type SurveyState,
} from "./survey-data";
import {
  AspectsStep,
  DoneStep,
  OverallStep,
  RecommendStep,
  TopicsStep,
  VisitStep,
  type SurveyErrors,
} from "./steps";
import { popStepItem } from "./motion";
import { Button } from "@/components/ui/button";
import { WizardCard } from "@/components/feedback/wizard";
import { reviewUrlFor } from "@/components/feedback/review-links";
import type { IncidentPrefill } from "@/components/reportar/incident-data";
import { submitSurvey, type SurveyResult } from "@/lib/feedback-api";
import { useBranches } from "@/lib/use-branches";
import { useMember } from "@/lib/member-session";

/**
 * Encuesta de satisfacción v2: anónima, por canal, 5 pasos. Vive dentro de la
 * pantalla dividida de /feedback (el cover es la intro). `onComplain` abre la
 * queja precargada: atajo con nota baja, enlace del pie o puente del gracias.
 */
export function SurveyExperience({ onComplain }: { onComplain: (prefill: IncidentPrefill) => void }) {
  const { accessToken, member } = useMember();
  const { branches } = useBranches();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SurveyState>(initialSurvey);
  const [errors, setErrors] = useState<SurveyErrors>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SurveyResult | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const name = STEPS[step];
  const branchName = branches.find((b) => b.id === state.branchId)?.name ?? "";

  const update = (patch: Partial<SurveyState>) => {
    setState((s) => ({ ...s, ...patch }));
    // Corregir un campo borra su error.
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(patch)) delete next[key as keyof SurveyErrors];
      return next;
    });
  };

  const complain = (surveyId?: string) =>
    onComplain({
      branchId: state.branchId,
      channel: state.channel,
      description: state.comment.trim(),
      surveyId,
    });

  /** Valida el paso actual; si falta algo, muestra el error y enfoca el primer grupo inválido. */
  function validate(): boolean {
    const missing = missingFields(name, state);
    if (missing.length === 0) return true;
    setErrors(Object.fromEntries(missing.map((f) => [f, FIELD_ERRORS[f]])));
    requestAnimationFrame(() => {
      const target = bodyRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"] [tabindex="0"], [aria-invalid="true"] button',
      );
      target?.focus();
    });
    return false;
  }

  async function handleNext() {
    if (!validate()) return;
    if (name !== "recommend") {
      setStep((s) => s + 1);
      return;
    }
    setSending(true);
    setSubmitError(null);
    try {
      setResult(await submitSurvey(state, accessToken));
      setStep((s) => s + 1);
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "No pudimos enviar tu encuesta. Revisa tu conexión e intenta de nuevo.",
      );
    } finally {
      setSending(false);
    }
  }

  function back() {
    setErrors({});
    setSubmitError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setState(initialSurvey);
    setErrors({});
    setSubmitError(null);
    setResult(null);
    setStep(0);
  }

  const isDone = name === "done";
  const stepProps = { state, update, errors, headingRef };

  function renderStep() {
    switch (name) {
      case "visit":
        return <VisitStep {...stepProps} />;
      case "overall":
        return <OverallStep {...stepProps} onComplain={() => complain()} />;
      case "aspects":
        return <AspectsStep {...stepProps} />;
      case "topics":
        return <TopicsStep {...stepProps} onComplain={() => complain()} />;
      case "recommend":
        return <RecommendStep {...stepProps} />;
      case "done":
        return (
          <DoneStep
            branchName={branchName}
            result={result}
            hasSession={Boolean(member && accessToken)}
            showBridge={isDetractor(state)}
            reviewUrl={state.recommend !== null && state.recommend >= 9 ? reviewUrlFor(branchName) : null}
            headingRef={headingRef}
            onBridge={() => complain(result?.id)}
            onRestart={restart}
          />
        );
    }
  }

  return (
    <div ref={bodyRef} className="flex w-full flex-col items-center">
      <WizardCard
        stepKey={name}
        stepLabel={isDone ? "¡Listo!" : `Paso ${step + 1} de ${NUM_STEPS}`}
        progress={isDone ? 1 : step / NUM_STEPS}
        tone="warm"
        announce={STEP_ANNOUNCE[name]}
        headingRef={headingRef}
      >
        {renderStep()}

        {!isDone && (
          <motion.div
            variants={popStepItem}
            className="mt-1 flex flex-col gap-4 border-t border-hair-div pt-6"
          >
            {submitError && (
              <p role="alert" className="text-[14px] font-medium text-coral">
                {submitError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {step > 0 ? (
                <Button variant="popGhost" size="popMd" onClick={back} className="gap-2" disabled={sending}>
                  <ArrowLeft aria-hidden="true" />
                  Atrás
                </Button>
              ) : (
                <span aria-hidden="true" />
              )}
              <Button
                variant="pop"
                size="popMd"
                onClick={handleNext}
                disabled={sending}
                aria-busy={sending || undefined}
                className="gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Enviando…
                  </>
                ) : name === "recommend" ? (
                  <>
                    Enviar
                    <Send aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </WizardCard>

      {!isDone && (
        <footer className="mt-6 flex w-full justify-center">
          <button
            type="button"
            onClick={() => complain()}
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[rgba(255,106,61,0.4)] bg-[rgba(255,106,61,0.1)] px-4 py-2 text-[14px] font-semibold text-coral transition-colors hover:border-coral hover:bg-[rgba(255,106,61,0.18)]"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-coral shadow-[0_0_8px_2px_rgba(255,106,61,0.7)]"
            />
            ¿Tienes una queja? Cuéntanosla aquí
          </button>
        </footer>
      )}
    </div>
  );
}
