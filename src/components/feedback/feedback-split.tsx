"use client";

import { useCallback, useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { SurveyExperience } from "@/components/satisfaccion/survey-experience";
import { IncidentExperience } from "@/components/reportar/incident-experience";

export type Choice = "encuesta" | "urgencia";

type ChoiceDef = {
  id: Choice;
  tone: "warm" | "urgent";
  Icon: LucideIcon;
  kicker: string;
  title: string;
  subtitle: string;
  cta: string;
  bannerLabel: string;
  /** Foto de fondo (opcional). Suelta el archivo en /public/img con este
   *  nombre y aparece detrás del scrim; si falta, queda el degradado. */
  img: string;
};

/**
 * Foto de fondo del cover/panel. Va detrás del sheen y el scrim (que oscurecen
 * la parte inferior para que el texto blanco siga legible). Si el archivo no
 * existe todavía, se oculta con onError y se ve el degradado de la marca.
 */
function FbPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- asset local en /public
    <img
      src={src}
      alt={alt}
      aria-hidden="true"
      className="fb-photo__img"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

// Order matters: index 0 = left slot, index 1 = right slot. When a side is
// chosen, its own slot becomes the accent panel and the OTHER slot renders the
// form, so the form opens exactly where the unpicked button used to sit.
const CHOICES: ChoiceDef[] = [
  {
    id: "encuesta",
    tone: "warm",
    Icon: ClipboardList,
    kicker: "Tu opinión cuenta",
    title: "Cuéntanos\ncómo te fue",
    subtitle:
      "En La Bodega queremos atenderte con el mayor estándar. Dinos cómo fue tu visita y nos ayudas a cuidarte aún mejor.",
    cta: "Dejar mi opinión",
    bannerLabel: "Tu opinión",
    img: "/img/feedback-opinion.png",
  },
  {
    id: "urgencia",
    tone: "urgent",
    Icon: AlertTriangle,
    kicker: "Estamos para resolverlo",
    title: "Reportar\nuna queja",
    subtitle:
      "Si algo no estuvo a la altura, queremos resolverlo de inmediato. Cuéntanos qué pasó y lo atendemos enseguida.",
    cta: "Reportar mi queja",
    bannerLabel: "Tu queja",
    img: "/img/feedback-queja.png",
  },
];

const toneClass = (t: ChoiceDef["tone"]) =>
  t === "urgent" ? "fb-photo--urgent" : "fb-photo--warm";

/** Spring shared by the collapse/expand column morph. */
const LAYOUT_SPRING = { type: "spring", stiffness: 260, damping: 30 } as const;

export function FeedbackSplit({
  selected,
  onSelect,
}: {
  selected: Choice | null;
  onSelect: (next: Choice | null, focus?: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const coverRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const backRef = useRef<HTMLButtonElement | null>(null);

  // Pointer parallax on the idle covers — driven outside React render (motion
  // values), never useState.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 18 });
  const sy = useSpring(py, { stiffness: 140, damping: 18 });
  const copyX = useTransform(sx, (v) => v * -10);
  const copyY = useTransform(sy, (v) => v * -7);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reduce || selected !== null) return;
      const r = e.currentTarget.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width - 0.5);
      py.set((e.clientY - r.top) / r.height - 0.5);
    },
    [px, py, reduce, selected],
  );
  const resetPointer = useCallback(() => {
    px.set(0);
    py.set(0);
  }, [px, py]);

  // Arrow-key roving between the two covers while in the choice state.
  const onCoverKeyDown = (e: React.KeyboardEvent, i: number) => {
    let ni = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % CHOICES.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      ni = (i - 1 + CHOICES.length) % CHOICES.length;
    else return;
    e.preventDefault();
    coverRefs.current[ni]?.focus();
  };

  const selectedDef = CHOICES.find((c) => c.id === selected) ?? null;

  return (
    <div
      className="fb-split"
      role="group"
      aria-label="¿Qué tipo de mensaje quieres enviar?"
      data-open={selected ?? undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
    >
      {CHOICES.map((c, i) => {
        const role: "cover" | "panel" | "form" =
          selected === null ? "cover" : c.id === selected ? "panel" : "form";

        return (
          <motion.div
            key={c.id}
            layout
            transition={LAYOUT_SPRING}
            className="fb-slot"
            data-role={role}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {/* --- CHOICE: big cover button --- */}
              {role === "cover" && (
                <motion.button
                  key="cover"
                  ref={(el) => {
                    coverRefs.current[i] = el;
                  }}
                  type="button"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelect(c.id)}
                  onKeyDown={(e) => onCoverKeyDown(e, i)}
                  aria-label={`${c.bannerLabel}. ${c.subtitle}`}
                  className={`fb-photo fb-cover fb-cover--${c.tone === "urgent" ? "urgent" : "warm"} ${toneClass(c.tone)} group`}
                >
                  <FbPhoto src={c.img} alt="" />
                  <span className="fb-photo__sheen" aria-hidden="true" />
                  <span className="fb-photo__scrim" aria-hidden="true" />

                  <span className="fb-cover__chevron" aria-hidden="true">
                    <ChevronRight size={21} strokeWidth={2.6} />
                  </span>

                  <motion.span
                    className="fb-cover__body flex flex-col gap-4"
                    style={reduce ? undefined : { x: copyX, y: copyY }}
                  >
                    <span className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(255,244,232,0.34)] bg-[rgba(24,10,4,0.28)] px-3.5 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.18em] text-[rgba(255,244,232,0.92)] backdrop-blur-sm">
                      <c.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
                      {c.kicker}
                    </span>
                    <span className="text-[40px] font-semibold leading-[1.0] tracking-tight whitespace-pre-line max-[560px]:text-[30px]">
                      {c.title}
                    </span>
                    <span className="max-w-[36ch] text-[15.5px] leading-[1.5] text-[rgba(255,244,232,0.92)]">
                      {c.subtitle}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-[rgba(255,244,232,0.96)] px-6 py-3 text-[15px] font-semibold text-[#2a0f07] shadow-[0_10px_24px_-12px_rgba(24,10,4,0.7)] transition-transform duration-200 group-hover:translate-x-1">
                      {c.cta}
                      <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                  </motion.span>
                </motion.button>
              )}

              {/* --- CHOSEN: accent panel (tall rail / mobile banner) --- */}
              {role === "panel" && (
                <motion.div
                  key="panel"
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`fb-photo fb-side ${toneClass(c.tone)}`}
                >
                  <FbPhoto src={c.img} alt="" />
                  <span className="fb-photo__sheen" aria-hidden="true" />
                  <span className="fb-photo__scrim" aria-hidden="true" />

                  {/* Desktop: tall rail */}
                  <div className="fb-side__full">
                    <span className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(255,244,232,0.34)] bg-[rgba(24,10,4,0.28)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[rgba(255,244,232,0.92)] backdrop-blur-sm">
                      <c.Icon size={13} strokeWidth={2.4} aria-hidden="true" />
                      Estás enviando
                    </span>
                    <div className="flex flex-col gap-5">
                      <span className="text-[24px] font-semibold leading-[1.08] tracking-tight whitespace-pre-line">
                        {c.title}
                      </span>
                      <button
                        type="button"
                        ref={backRef}
                        className="fb-back self-start"
                        onClick={() => onSelect(null, true)}
                      >
                        <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" />
                        Cambiar
                      </button>
                    </div>
                  </div>

                  {/* Mobile: slim banner */}
                  <div className="fb-side__bar">
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(255,244,232,0.42)] bg-[rgba(24,10,4,0.3)]">
                        <c.Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[rgba(255,244,232,0.82)]">
                          Estás enviando
                        </span>
                        <span className="text-[15px] font-semibold">{c.bannerLabel}</span>
                      </span>
                    </span>
                    <button
                      type="button"
                      className="fb-back"
                      onClick={() => onSelect(null, true)}
                    >
                      <ArrowLeft size={15} strokeWidth={2.4} aria-hidden="true" />
                      Cambiar
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- FORM: opens in the other slot, beside the accent panel --- */}
              {role === "form" && selectedDef && (
                <motion.div
                  key="form"
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  className="fb-formwrap"
                  role="region"
                  aria-label={selectedDef.bannerLabel}
                >
                  {selectedDef.id === "encuesta" ? (
                    <SurveyExperience embedded onUrgent={() => onSelect("urgencia", true)} />
                  ) : (
                    <IncidentExperience embedded onSurvey={() => onSelect("encuesta", true)} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
