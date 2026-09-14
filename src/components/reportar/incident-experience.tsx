"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { AlertTriangle, ArrowLeft, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/satisfaccion/brand-logo";
import { ChipGroup } from "@/components/satisfaccion/chip-group";
import { BrandTextField, BrandTextArea } from "@/components/satisfaccion/brand-field";
import { PopScene } from "@/components/pop-scene";
import { shellContainer, shellItem, popStepItem } from "@/components/satisfaccion/motion";
import { MediaUpload } from "./media-upload";
import { AudioRecorder } from "./audio-recorder";
import {
  initialIncident,
  PROBLEMAS,
  SUCURSALES,
  type IncidentState,
  type MediaItem,
} from "./incident-data";

const labelCls = "text-[13px] font-medium uppercase tracking-[0.14em] text-label";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={popStepItem} className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className={labelCls}>{label}</span>
        {hint && <span className="text-[14px] text-muted-ink">{hint}</span>}
      </div>
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
  const [state, setState] = useState<IncidentState>(initialIncident);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [descMode, setDescMode] = useState<"text" | "audio">("text");
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");

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

  async function submit() {
    if (!hasContent || phase === "sending") return;
    setPhase("sending");
    // Sin backend por ahora: simulamos el envío. Aquí iría el upload real.
    await new Promise((r) => setTimeout(r, 1400));
    setPhase("done");
    try {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  function reset() {
    media.forEach((m) => URL.revokeObjectURL(m.url));
    setState(initialIncident);
    setMedia([]);
    setAudio(null);
    setDescMode("text");
    setPhase("form");
  }

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

      <motion.section
        variants={shellItem}
        className={
          "pop-card relative w-full px-9 pt-9 pb-8 max-[560px]:px-5 max-[560px]:pt-7 max-[560px]:pb-6" +
          (embedded ? "" : " mt-6")
        }
      >
              <AnimatePresence mode="wait">
                {phase === "done" ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-5 py-6 text-center"
                  >
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
                      Reporte enviado
                    </h1>
                    <p className="max-w-[44ch] text-[17px] leading-[1.5] text-body">
                      Un encargado lo revisa de inmediato. Si dejaste tu
                      contacto, te escribimos enseguida.
                    </p>
                    <div className="mt-1 flex flex-col items-center gap-3">
                      {doneSurveyCta}
                      <button
                        type="button"
                        onClick={reset}
                        className="text-[14px] font-medium text-muted-ink underline-offset-4 transition-colors hover:text-cream hover:underline"
                      >
                        Enviar otro reporte
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    variants={{ enter: { transition: { staggerChildren: 0.05 } } }}
                    initial="hidden"
                    animate="enter"
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-7"
                  >
                    {/* Title */}
                    <motion.div variants={popStepItem} className="flex flex-col gap-3">
                      <span className="pop-badge pop-badge-coral w-fit text-[12px] uppercase tracking-[0.08em]">
                        <AlertTriangle size={14} strokeWidth={2.4} aria-hidden="true" />
                        Atención inmediata
                      </span>
                      <h1 className="m-0 text-[44px] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-cream text-balance max-[560px]:text-[34px]">
                        Reporta una
                        <br />
                        urgencia
                      </h1>
                      <p className="text-[17px] leading-[1.5] text-body max-w-[48ch]">
                        Comida en mal estado, un objeto extraño o algo que no
                        puede esperar. Sube la evidencia y cuéntanos: lo
                        atendemos ya. No hace falta llenar toda la encuesta.
                      </p>
                    </motion.div>

                    {/* Dónde — primero, para ubicar el local */}
                    <Field label="¿Dónde fue?" hint="Elige el local donde ocurrió.">
                      <ChipGroup
                        variant="branch"
                        ariaLabel="Sucursal"
                        options={SUCURSALES}
                        value={state.sucursal}
                        onSelect={(v) => set("sucursal", v)}
                      />
                    </Field>

                    {/* Qué pasó — categoría */}
                    <Field label="¿Qué pasó?" hint="Marca lo que aplique.">
                      <ChipGroup
                        variant="topic"
                        tone="danger"
                        multi
                        ariaLabel="Tipo de problema"
                        options={PROBLEMAS}
                        value={state.problemas}
                        onSelect={toggleProblema}
                      />
                    </Field>

                    {/* Evidencia */}
                    <Field label="Evidencia" hint="Una foto o video ayuda muchísimo.">
                      <MediaUpload items={media} onChange={setMedia} />
                    </Field>

                    {/* Descripción: texto o audio */}
                    <Field label="Descripción">
                      <div className="flex flex-col gap-3">
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
                            label="Cuéntanos qué ocurrió"
                            value={state.descripcion}
                            onChange={(v) => set("descripcion", v)}
                            placeholder="Qué encontraste, en qué plato, a qué hora…"
                          />
                        ) : (
                          <AudioRecorder onChange={setAudio} />
                        )}
                      </div>
                    </Field>

                    {/* Contacto */}
                    <motion.div
                      variants={popStepItem}
                      className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4"
                    >
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
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                      variants={popStepItem}
                      className="flex flex-col gap-2 border-t border-hair-div pt-6"
                    >
                      <Button
                        variant="popCoral"
                        size="popLg"
                        onClick={submit}
                        disabled={!hasContent || phase === "sending"}
                        className="w-full disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {phase === "sending" ? (
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
                            Enviando…
                          </span>
                        ) : (
                          "Enviar reporte"
                        )}
                      </Button>
                      <span className="text-center text-[13px] text-muted-ink">
                        {hasContent
                          ? "Lo recibe el equipo al instante."
                          : "Marca un problema, sube evidencia o escríbenos para enviar."}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
        </AnimatePresence>
      </motion.section>

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
