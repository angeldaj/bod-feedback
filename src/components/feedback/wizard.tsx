"use client";

// Piezas compartidas de los dos formularios de /feedback (encuesta y queja):
// progreso + tarjeta con morph de altura entre pasos, región viva que anuncia
// el paso, bloques tipográficos y el error de grupo junto al campo.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { popStepContainer, popStepItem, shellContainer, shellItem } from "@/components/satisfaccion/motion";

export const cls = {
  eyebrow: "text-[12px] font-semibold uppercase tracking-[0.2em] text-coral",
  eyebrowSerif: "font-serif italic text-[22px] text-gold-accent",
  title:
    "m-0 text-[40px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream text-balance max-[560px]:text-[32px] outline-none",
  lead: "font-serif text-[19px] italic leading-[1.4] text-muted-ink text-pretty",
  body: "text-[17px] leading-[1.55] text-body max-w-[52ch] text-pretty",
  groupLabel: "text-[13px] font-medium uppercase tracking-[0.14em] text-label",
};

export function Item({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={popStepItem} className={className}>
      {children}
    </motion.div>
  );
}

/** Encabezado de paso. Recibe el foco al cambiar de paso (tabIndex -1). */
export function StepHeading({
  eyebrow,
  title,
  lead,
  headingRef,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <>
      <Item className={cls.eyebrow}>{eyebrow}</Item>
      <Item>
        <h2 ref={headingRef} tabIndex={-1} className={cls.title}>
          {title}
        </h2>
      </Item>
      {lead && (
        <Item>
          <p className={cls.lead}>{lead}</p>
        </Item>
      )}
    </>
  );
}

export function GroupLabel({
  id,
  icon: Icon,
  children,
}: {
  id?: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div id={id} className={cls.groupLabel}>
      <span className="inline-flex items-center gap-2">
        {Icon && <Icon size={14} strokeWidth={2.2} aria-hidden="true" className="text-gold-accent" />}
        {children}
      </span>
    </div>
  );
}

/** Error de un grupo (chips, escala) que se muestra justo debajo de él. */
export function FieldError({ id, message }: { id: string; message?: string | null }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          key={message}
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-coral"
        >
          <AlertCircle size={15} strokeWidth={2.2} aria-hidden="true" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Aviso en línea (911, "¿sigues en el local?", fricción suave…). */
export function Notice({
  tone = "warm",
  icon: Icon,
  role,
  children,
  className,
}: {
  tone?: "warm" | "alert";
  icon: LucideIcon;
  role?: "alert" | "status";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role={role} className={cn("pop-notice", `pop-notice--${tone}`, className)}>
      <span className="pop-notice__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1 text-[15px] leading-[1.5]">{children}</div>
    </div>
  );
}

/**
 * Progreso + tarjeta del asistente. El contenido de cada paso entra con stagger
 * y la tarjeta hace morph de altura. Al cambiar `stepKey` se anuncia el paso,
 * la tarjeta se trae a la vista si quedó arriba y el foco va al encabezado.
 */
export function WizardCard({
  stepKey,
  stepLabel,
  progress,
  tone,
  announce,
  headingRef,
  top,
  children,
}: {
  stepKey: string;
  stepLabel: string;
  /** 0..1 */
  progress: number;
  tone: "warm" | "urgent";
  announce: string;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
  /** Se pinta dentro de la tarjeta, sobre el paso (p. ej. el cuadro de políticas). */
  top?: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [height, setHeight] = useState<number | "auto">("auto");
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const setContentRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    roRef.current = null;
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
    if (announceRef.current) announceRef.current.textContent = announce;
  }, [announce]);

  // Al cambiar de paso (no en el primer render): si el tope de la tarjeta quedó
  // fuera de la vista (p. ej. tras tocar "Siguiente" al fondo de un paso largo
  // en el teléfono), se trae a la vista; luego el foco va al título del paso.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const section = sectionRef.current;
    if (section && section.getBoundingClientRect().top < 0) {
      section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
    const t = window.setTimeout(() => headingRef?.current?.focus({ preventScroll: true }), reduce ? 0 : 260);
    return () => window.clearTimeout(t);
  }, [stepKey, reduce, headingRef]);

  return (
    <motion.div
      variants={shellContainer}
      initial="hidden"
      animate="enter"
      className="relative z-[1] flex w-full flex-col items-center"
    >
      <motion.div variants={shellItem} className="flex w-full items-center gap-4">
        <div
          className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--lb-hair-track)]"
          role="progressbar"
          aria-label="Progreso"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div
            className={cn("pop-fill", tone === "urgent" && "pop-fill--coral")}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="text-[12px] font-medium whitespace-nowrap uppercase tracking-[0.2em] text-muted-ink">
          {stepLabel}
        </div>
      </motion.div>

      <motion.section
        ref={sectionRef}
        variants={shellItem}
        className="pop-card relative mt-6 w-full scroll-mt-4 px-9 pt-9 pb-8 max-[560px]:px-5 max-[560px]:pt-7 max-[560px]:pb-6"
      >
        {top}
        {/* El recorte del morph se agranda con margen negativo + padding para
            que sombras, anillos de foco y el rebote de chips no se corten. */}
        <motion.div
          className="-mx-4 -mb-6 overflow-hidden"
          animate={{ height }}
          transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={stepKey}
              ref={setContentRef}
              variants={popStepContainer}
              initial="hidden"
              animate="enter"
              exit="leaving"
              className="flex flex-col gap-6 px-4 pt-1 pb-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.section>

      <div ref={announceRef} role="status" aria-live="polite" className="sr-only" />
    </motion.div>
  );
}
