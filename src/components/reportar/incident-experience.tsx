"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  LoaderCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/satisfaccion/brand-logo";
import { ChipGroup } from "@/components/satisfaccion/chip-group";
import { BrandTextField, BrandTextArea } from "@/components/satisfaccion/brand-field";
import { PopScene } from "@/components/pop-scene";
import {
  shellContainer,
  shellItem,
  popStepContainer,
  popStepItem,
} from "@/components/satisfaccion/motion";
import { MediaUpload } from "./media-upload";
import { AudioRecorder } from "./audio-recorder";
import {
  initialIncident,
  PROBLEMAS,
  SUCURSALES,
  type IncidentState,
  type MediaItem,
} from "./incident-data";

// Wizard steps (intro + 4 numbered), mirroring the survey. "done" is driven by
// `phase` after submit, not a step index.
const STEPS = ["intro", "que", "evidencia", "descripcion", "contacto"] as const;
type IStep = (typeof STEPS)[number];
const NUM_STEPS = 4;

const STEP_ANNOUNCE: Record<IStep, string> = {
  intro: "Reportar una queja",
  que: "Paso uno: qué ocurrió",
  evidencia: "Paso dos: evidencia",
  descripcion: "Paso tres: cuéntanos",
  contacto: "Paso cuatro: te contactamos",
};

const cls = {
  eyebrow: "text-[12px] font-semibold uppercase tracking-[0.2em] text-coral",
  title:
    "m-0 text-[40px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream text-balance max-[560px]:text-[32px]",
  body: "text-[18px] leading-[1.55] text-body max-w-[52ch] text-pretty",
  groupLabel: "text-[13px] font-medium uppercase tracking-[0.14em] text-label",
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

export function IncidentExperience({
  embedded = false,
  onSurvey,
}: {
  /** Rendered inside the /feedback tab shell: drops its own page chrome
   *  (main wrapper, background glow, brand header, page footer). */
  embedded?: boolean;
  /** When embedded, links back to the survey switch tabs instead of navigating. */
  onSurvey?: () => void;
} = {}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [state, setState] = useState<IncidentState>(initialIncident);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [descMode, setDescMode] = useState<"text" | "audio">("text");
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [height, setHeight] = useState<number | "auto">("auto");

  const contentRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  const name = STEPS[step];

  const set = <K extends keyof IncidentState>(k: K, v: IncidentState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const toggleProblema = (label: string) =>
    setState((s) => ({
      ...s,
      problemas: s.problemas.includes(label)
        ? s.problemas.filter((p) => p !== label)
        : [...s.problemas, label],
    }));

  const hasContent =
    state.problemas.length > 0 ||
    media.length > 0 ||
    state.descripcion.trim().length > 0 ||
    !!audio;

  // Card height morph between steps (same technique as the survey).
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

  useEffect(() => {
    if (announceRef.current) announceRef.current.textContent = STEP_ANNOUNCE[name];
  }, [name]);

  // Standalone (full-page) resets scroll on each step; embedded in the /feedback
  // split we keep the reader's position instead of yanking to top.
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
  const next = () => goto(1);
  const back = () => goto(-1);

  async function submit() {
    if (!hasContent || phase === "sending") return;
    setPhase("sending");
    // Sin backend por ahora: simulamos el envío. Aquí iría el upload real.
    await new Promise((r) => setTimeout(r, 1400));
    setPhase("done");
    resetScroll();
  }

  function reset() {
    media.forEach((m) => URL.revokeObjectURL(m.url));
    setState(initialIncident);
    setMedia([]);
    setAudio(null);
    setDescMode("text");
    setPhase("form");
    setDir(-1);
    setStep(0);
  }

  const pct = Math.round((Math.min(step, NUM_STEPS) / NUM_STEPS) * 100);
  const stepLabel =
    phase === "done" ? "Enviado" : `Paso ${Math.max(1, step)} de ${NUM_STEPS}`;
  const showNav = phase !== "done" && step >= 1 && step <= NUM_STEPS;
  const isLast = step === NUM_STEPS;

  const doneSurveyCta =
    embedded && onSurvey ? (
      <Button variant="pop" size="popMd" onClick={onSurvey}>
        Cuando puedas, completa la encuesta
      </Button>
    ) : (
      <Button variant="pop" size="popMd" render={<Link href="/satisfaccion" />}>
        Cuando puedas, completa la encuesta
      </Button>
    );

  function renderStep() {
    switch (name) {
      case "intro":
        return (
          <>
            <Item>
              <span className="pop-badge pop-badge-coral w-fit text-[12px] uppercase tracking-[0.08em]">
                <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" />
                Te atendemos ya
              </span>
            </Item>
            <Item>
              <h1 className="m-0 text-[48px] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-cream text-balance max-[560px]:text-[36px]">
                Reportar
                <br />
                una queja
              </h1>
            </Item>
            <Item>
              <p className={cls.body}>
                En La Bodega queremos que cada visita sea impecable. Si algo no
                estuvo a la altura, cuéntanos qué pasó y sube una foto si
                puedes: lo resolvemos de inmediato.
              </p>
            </Item>
            <Item className="mt-1 flex flex-wrap items-center gap-4">
              <Button variant="popCoral" size="popLg" onClick={next} className="gap-2">
                Comenzar
                <ArrowRight aria-hidden="true" />
              </Button>
              <span className="font-serif text-[17px] italic text-muted-ink">
                Te toma menos de un minuto
              </span>
            </Item>
          </>
        );

      case "que":
        return (
          <>
            <Item className={cls.eyebrow}>Paso uno</Item>
            <Item>
              <h2 className={cls.title}>¿Qué ocurrió?</h2>
            </Item>
            <Item className="flex flex-col gap-3">
              <div className={cls.groupLabel}>¿Dónde te atendimos?</div>
              <ChipGroup
                variant="branch"
                ariaLabel="Sucursal"
                options={SUCURSALES}
                value={state.sucursal}
                onSelect={(v) => set("sucursal", v)}
              />
            </Item>
            <Item className="flex flex-col gap-3">
              <div className={cls.groupLabel}>¿Qué te sucedió?</div>
              <ChipGroup
                variant="topic"
                tone="danger"
                multi
                ariaLabel="Tipo de problema"
                options={PROBLEMAS}
                value={state.problemas}
                onSelect={toggleProblema}
              />
            </Item>
          </>
        );

      case "evidencia":
        return (
          <>
            <Item className={cls.eyebrow}>Paso dos</Item>
            <Item>
              <h2 className={cls.title}>Evidencia</h2>
            </Item>
            <Item>
              <p className="text-[16px] leading-[1.5] text-muted-ink">
                Si tienes una foto o un video, nos ayuda a resolverlo más rápido
                para ti. Es totalmente opcional.
              </p>
            </Item>
            <Item>
              <MediaUpload items={media} onChange={setMedia} />
            </Item>
          </>
        );

      case "descripcion":
        return (
          <>
            <Item className={cls.eyebrow}>Paso tres</Item>
            <Item>
              <h2 className={cls.title}>Cuéntanos</h2>
            </Item>
            <Item className="flex flex-col gap-3">
              <div className="inline-flex w-fit rounded-full border border-hair-div bg-[var(--lb-input)] p-1">
                {(["text", "audio"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDescMode(m)}
                    aria-pressed={descMode === m}
                    className={
                      "relative isolate rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors " +
                      (descMode === m ? "text-[#2a0f07]" : "text-body hover:text-cream")
                    }
                  >
                    {descMode === m && (
                      <motion.span
                        layoutId="descseg"
                        className="absolute inset-0 -z-10 rounded-full bg-coral-hi"
                        transition={{ type: "spring", stiffness: 460, damping: 32 }}
                      />
                    )}
                    {m === "text" ? "Escribir" : "Grabar audio"}
                  </button>
                ))}
              </div>

              {descMode === "text" ? (
                <BrandTextArea
                  label="Cuéntanos con tus palabras qué te pasó"
                  value={state.descripcion}
                  onChange={(v) => set("descripcion", v)}
                  placeholder="Qué encontraste, en qué plato, a qué hora…"
                />
              ) : (
                <AudioRecorder onChange={setAudio} />
              )}
            </Item>
          </>
        );

      case "contacto":
        return (
          <>
            <Item className={cls.eyebrow}>Paso cuatro</Item>
            <Item>
              <h2 className={cls.title}>¿Te contactamos?</h2>
            </Item>
            <Item>
              <p className={cls.body}>
                Opcional, pero nos encantaría responderte. Si dejas tus datos,
                un encargado te escribe enseguida para resolverlo contigo.
              </p>
            </Item>
            <Item className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <BrandTextField
                label="Nombre"
                autoComplete="name"
                placeholder="Tu nombre"
                value={state.nombre}
                onChange={(v) => set("nombre", v)}
              />
              <BrandTextField
                label="Teléfono o correo"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+58 ··· / tu@correo"
                value={state.contacto}
                onChange={(v) => set("contacto", v)}
              />
            </Item>
            {!hasContent && (
              <Item>
                <span className="text-[13px] text-muted-ink">
                  Cuéntanos qué pasó, sube una foto o escríbenos para poder ayudarte.
                </span>
              </Item>
            )}
          </>
        );
    }
  }

  const body = (
    <motion.div
      variants={shellContainer}
      initial="hidden"
      animate="enter"
      className="relative z-[1] flex w-full flex-col items-center"
    >
      {/* Header — only when standalone; the /feedback shell owns brand + tabs. */}
      {!embedded && (
        <motion.header
          variants={shellItem}
          className="flex w-full items-center justify-between gap-4"
        >
          <BrandLogo width={104} />
          <Link
            href="/satisfaccion"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-ink transition-colors hover:text-cream"
          >
            <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
            Encuesta
          </Link>
        </motion.header>
      )}

      {/* Progress */}
      <motion.div
        variants={shellItem}
        className={(embedded ? "" : "mt-7 ") + "flex w-full items-center gap-4"}
      >
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--lb-hair-track)]">
          <div className="pop-fill pop-fill--coral" style={{ width: `${pct}%` }} />
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
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={phase === "done" ? "done" : name}
              ref={setContentRef}
              variants={popStepContainer}
              initial="hidden"
              animate="enter"
              exit="leaving"
              className="flex flex-col gap-6"
            >
              {phase === "done" ? (
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    className="flex h-[74px] w-[74px] items-center justify-center rounded-full"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--lb-coral-hi), var(--lb-coral-deep))",
                    }}
                  >
                    <Check size={38} strokeWidth={2.4} className="text-white" aria-hidden="true" />
                  </motion.div>
                  <h1 className="text-[42px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream">
                    Gracias por avisarnos
                  </h1>
                  <p className="max-w-[44ch] text-[17px] leading-[1.5] text-body">
                    Ya recibimos tu queja y un encargado la revisa de inmediato.
                    Si dejaste tu contacto, te escribimos enseguida para
                    resolverlo.
                  </p>
                  <div className="mt-1 flex flex-col items-center gap-3">
                    {doneSurveyCta}
                    <button
                      type="button"
                      onClick={reset}
                      className="text-[14px] font-medium text-muted-ink underline-offset-4 transition-colors hover:text-cream hover:underline"
                    >
                      Enviar otra queja
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {renderStep()}

                  {showNav && (
                    <motion.div
                      variants={popStepItem}
                      className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-hair-div pt-6"
                    >
                      <Button variant="popGhost" size="popMd" onClick={back} className="gap-2">
                        <ArrowLeft aria-hidden="true" />
                        Atrás
                      </Button>
                      {isLast ? (
                        <Button
                          variant="popCoral"
                          size="popMd"
                          onClick={submit}
                          disabled={!hasContent || phase === "sending"}
                          className="gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {phase === "sending" ? (
                            <span className="inline-flex items-center gap-2">
                              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                              Enviando…
                            </span>
                          ) : (
                            <>
                              Enviar mi queja
                              <Send size={17} aria-hidden="true" />
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="popCoral" size="popMd" onClick={next} className="gap-2">
                          Siguiente
                          <ArrowRight aria-hidden="true" />
                        </Button>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.section>

      {/* SR-only live region announcing the current step. */}
      <div ref={announceRef} aria-live="polite" className="sr-only" />

      {!embedded && (
        <motion.footer
          variants={shellItem}
          className="mt-6 flex w-full flex-wrap items-center justify-center gap-3 text-[13px] uppercase tracking-[0.12em] text-label"
        >
          <span>Puerto Ordaz · Venezuela</span>
        </motion.footer>
      )}
    </motion.div>
  );

  return (
    <MotionConfig reducedMotion="user">
      {embedded ? (
        body
      ) : (
        <main className="relative z-[1] flex w-full flex-col items-center px-5 pt-9 pb-16 max-[560px]:px-3.5 max-[560px]:pt-6 max-[560px]:pb-10">
          <div className="relative w-full max-w-[680px]">
            <PopScene tone="urgent" />
            {body}
          </div>
        </main>
      )}
    </MotionConfig>
  );
}
