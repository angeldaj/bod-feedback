"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  Armchair,
  ArrowRight,
  Bike,
  Clock,
  Croissant,
  ExternalLink,
  Gift,
  HandPlatter,
  HeartHandshake,
  MapPin,
  Moon,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Sun,
  Sunrise,
  Timer,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { springBouncy } from "./motion";
import { RatingScale } from "./rating-scale";
import { NpsScale } from "./nps-scale";
import { ChipGroup } from "./chip-group";
import { BrandTextField, BrandTextArea } from "./brand-field";
import { Button } from "@/components/ui/button";
import {
  ASPECTS_BY_CHANNEL,
  CHANNELS,
  CHANNEL_LABELS,
  MOMENTS,
  MOMENT_LABELS,
  TOPICS,
  TOPIC_LABELS,
  type AspectKey,
  type Channel,
  type Moment,
  type Topic,
} from "@/components/feedback/feedback-catalog";
import { cls, FieldError, GroupLabel, Item, StepHeading } from "@/components/feedback/wizard";
import { OVERALL_LABELS, type SurveyField, type SurveyState } from "./survey-data";
import { useBranches } from "@/lib/use-branches";
import type { SurveyResult } from "@/lib/feedback-api";

export type SurveyErrors = Partial<Record<SurveyField, string>>;

export type StepProps = {
  state: SurveyState;
  update: (patch: Partial<SurveyState>) => void;
  errors: SurveyErrors;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
};

// Un icono por opción: lectura instantánea al escoger.
const CHANNEL_ICON: Record<Channel, LucideIcon> = {
  dine_in: UtensilsCrossed,
  bakery: Croissant,
  takeaway: ShoppingBag,
  delivery: Bike,
};

const MOMENT_ICON: Record<Moment, LucideIcon> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
};

const ASPECT_ICON: Record<AspectKey, LucideIcon> = {
  food: UtensilsCrossed,
  service: HandPlatter,
  ambiance: Armchair,
  waitTime: Clock,
  packaging: Package,
  punctuality: Timer,
  courier: Bike,
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

const errId = (field: SurveyField) => `survey-err-${field}`;

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Atajo a queja cuando la nota es baja (pasos 2 y 4). */
function ComplainShortcut({ onComplain, detailed }: { onComplain: () => void; detailed?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-[rgba(255,106,61,0.4)] bg-[rgba(255,106,61,0.1)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="pop-badge pop-badge-coral text-[12px] uppercase tracking-[0.06em]">Queja</span>
        <span className="text-[16px] font-semibold text-cream">¿Algo no estuvo bien?</span>
      </div>
      {detailed && (
        <p className="text-[15px] leading-[1.5] text-body">
          Si encontraste comida en mal estado, fría, cruda o un objeto extraño, no hace falta que
          llenes toda la encuesta: repórtalo con una foto y lo resolvemos de inmediato para ti.
        </p>
      )}
      <div>
        <Button variant="popCoral" size="popSm" onClick={onComplain} className="min-h-11 gap-2">
          Repórtalo como queja
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// ---- Paso 1: ¿Dónde nos visitaste? ----
export function VisitStep({ state, update, errors, headingRef }: StepProps) {
  const { branches, loading, error } = useBranches();
  const branchIds = branches.map((b) => b.id);
  const branchLabels = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const branchIcons = Object.fromEntries(branches.map((b) => [b.id, MapPin]));
  const branchName = branchLabels[state.branchId];

  return (
    <>
      <StepHeading
        eyebrow="Paso uno"
        title="¿Dónde nos visitaste?"
        lead="Así tu opinión llega al equipo correcto."
        headingRef={headingRef}
      />

      <Item className="flex flex-col gap-3">
        <GroupLabel id="survey-branch-label" icon={Store}>
          La sucursal
        </GroupLabel>
        {loading ? (
          <p className="text-[14px] text-muted-ink">Cargando sucursales…</p>
        ) : error ? (
          <p role="alert" className="text-[14px] text-coral">
            {error}
          </p>
        ) : (
          <ChipGroup
            variant="branch"
            ariaLabel="Sucursal"
            icons={branchIcons}
            options={branchIds}
            labels={branchLabels}
            value={state.branchId}
            onSelect={(v) => update({ branchId: v })}
            invalid={Boolean(errors.branchId)}
            describedBy={errors.branchId ? errId("branchId") : undefined}
          />
        )}
        <FieldError id={errId("branchId")} message={errors.branchId} />
      </Item>

      <Item className="flex flex-col gap-3">
        <GroupLabel icon={UtensilsCrossed}>¿Cómo nos visitaste?</GroupLabel>
        <ChipGroup
          variant="branch"
          ariaLabel="¿Cómo nos visitaste?"
          icons={CHANNEL_ICON}
          options={CHANNELS}
          labels={CHANNEL_LABELS}
          value={state.channel}
          onSelect={(v) => update({ channel: v as Channel })}
          invalid={Boolean(errors.channel)}
          describedBy={errors.channel ? errId("channel") : undefined}
        />
        <FieldError id={errId("channel")} message={errors.channel} />
      </Item>

      <Item className="flex flex-col gap-3">
        <GroupLabel icon={Clock}>¿En qué momento?</GroupLabel>
        <ChipGroup
          variant="branch"
          ariaLabel="¿En qué momento?"
          icons={MOMENT_ICON}
          options={MOMENTS}
          labels={MOMENT_LABELS}
          value={state.moment}
          onSelect={(v) => update({ moment: v as Moment })}
          invalid={Boolean(errors.moment)}
          describedBy={errors.moment ? errId("moment") : undefined}
        />
        <FieldError id={errId("moment")} message={errors.moment} />
      </Item>

      <Item className="min-h-[1.5em]">
        <AnimatePresence mode="wait">
          {branchName && (
            <motion.p
              key={`${state.branchId}-${state.moment}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-[20px] italic text-gold-accent"
            >
              {state.moment
                ? `${MOMENT_LABELS[state.moment]} en ${branchName}, gracias por venir.`
                : `Nos alegra verte en ${branchName}.`}
            </motion.p>
          )}
        </AnimatePresence>
      </Item>
    </>
  );
}

// ---- Paso 2: ¿Qué tal la pasaste? ----
export function OverallStep({
  state,
  update,
  errors,
  headingRef,
  onComplain,
}: StepProps & { onComplain: () => void }) {
  const lowScore = state.overall > 0 && state.overall <= 2;
  return (
    <>
      <StepHeading
        eyebrow="Paso dos"
        title="¿Qué tal la pasaste?"
        lead="Uno si algo falló, cinco si te vas con ganas de volver."
        headingRef={headingRef}
      />
      <Item className="flex flex-col gap-3">
        <RatingScale
          variant="overall"
          value={state.overall}
          onChange={(n) => update({ overall: n })}
          ariaLabel="Satisfacción general, de 1 a 5"
          invalid={Boolean(errors.overall)}
          describedBy={errors.overall ? errId("overall") : undefined}
        />
        <div className="flex max-w-[430px] justify-between text-[13px] font-medium uppercase tracking-[0.12em] text-label">
          <span>Mala</span>
          <span>Excelente</span>
        </div>
        <FieldError id={errId("overall")} message={errors.overall} />
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
      {lowScore && (
        <Item>
          <ComplainShortcut onComplain={onComplain} />
        </Item>
      )}
    </>
  );
}

// ---- Paso 3: ¿Cómo estuvo cada cosa? (aspectos según el canal) ----
export function AspectsStep({ state, update, headingRef }: StepProps) {
  const aspects = state.channel ? ASPECTS_BY_CHANNEL[state.channel] : [];
  return (
    <>
      <StepHeading
        eyebrow="Paso tres"
        title="¿Cómo estuvo cada cosa?"
        lead="Puntúa solo lo que quieras; lo que dejes en blanco lo saltamos."
        headingRef={headingRef}
      />
      <Item className="flex flex-col gap-1">
        {aspects.map((a) => {
          const Icon = ASPECT_ICON[a.key];
          const value = state.aspects[a.key] ?? 0;
          const rated = value > 0;
          return (
            <div
              key={a.key}
              className="flex flex-wrap items-center justify-between gap-4 border-t border-hair-div py-4 first:border-t-0 max-[560px]:flex-col max-[560px]:items-start max-[560px]:gap-2.5"
            >
              <div className="flex items-center gap-3.5">
                <motion.span
                  animate={{ scale: rated ? 1.06 : 1 }}
                  transition={springBouncy}
                  className={
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] transition-colors duration-300 " +
                    (rated
                      ? "bg-[linear-gradient(105deg,var(--lb-gold-hi),var(--lb-gold))] text-[color:var(--lb-ink-on-gold)] shadow-[0_8px_20px_-8px_rgba(217,169,74,0.7)]"
                      : "bg-[var(--lb-input)] text-gold-accent")
                  }
                >
                  <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                </motion.span>
                <div>
                  <div className="text-[21px] font-semibold uppercase tracking-[0.02em] text-cream">
                    {a.label}
                  </div>
                  <div className="font-serif text-[16px] italic text-muted-ink">{a.hint}</div>
                </div>
              </div>
              <RatingScale
                variant="dots"
                clearable
                value={value}
                onChange={(n) => {
                  const next = { ...state.aspects };
                  if (n) next[a.key] = n;
                  else delete next[a.key];
                  update({ aspects: next });
                }}
                ariaLabel={`${a.label}, de 1 a 5 (opcional)`}
              />
            </div>
          );
        })}
      </Item>
    </>
  );
}

// ---- Paso 4: lo que más te gustó / lo que podemos mejorar ----
export function TopicsStep({
  state,
  update,
  headingRef,
  onComplain,
}: StepProps & { onComplain: () => void }) {
  const lowScore = state.overall > 0 && state.overall <= 2;
  return (
    <>
      <StepHeading eyebrow="Paso cuatro" title="Lo que más te gustó" headingRef={headingRef} />
      <Item>
        <ChipGroup
          variant="topic"
          multi
          checkOnSelected
          ariaLabel="Lo que más te gustó"
          options={TOPICS}
          labels={TOPIC_LABELS}
          value={state.positiveTopics}
          onSelect={(v) => update({ positiveTopics: toggle(state.positiveTopics, v as Topic) })}
        />
      </Item>

      <Item className="flex flex-col gap-4 border-t border-hair-div pt-6">
        <h3 className="m-0 text-[26px] font-semibold uppercase leading-none tracking-[0.01em] text-cream">
          Lo que podemos mejorar
        </h3>
        <ChipGroup
          variant="topic"
          tone="danger"
          multi
          checkOnSelected
          ariaLabel="Lo que podemos mejorar"
          options={TOPICS}
          labels={TOPIC_LABELS}
          value={state.negativeTopics}
          onSelect={(v) => update({ negativeTopics: toggle(state.negativeTopics, v as Topic) })}
        />
      </Item>

      {lowScore && (
        <Item>
          <ComplainShortcut onComplain={onComplain} detailed />
        </Item>
      )}

      <Item className="flex flex-col gap-3 border-t border-hair-div pt-6">
        <p className="flex items-start gap-2.5 text-[17px] leading-[1.45] text-body">
          <HeartHandshake size={20} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-accent" />
          ¿Alguien del equipo te atendió especialmente bien? Dinos su nombre y se lo haremos saber.
        </p>
        <BrandTextField
          label="Su nombre"
          optional
          autoComplete="off"
          placeholder="Ej. María, la de caja"
          maxLength={80}
          value={state.staffMention}
          onChange={(v) => update({ staffMention: v })}
        />
      </Item>
      <Item>
        <BrandTextArea
          label="Cuéntanos con tus palabras"
          optional
          rows={4}
          maxLength={2000}
          value={state.comment}
          onChange={(v) => update({ comment: v })}
          placeholder="Lo que pasó, lo que te gustó, lo que esperabas…"
        />
      </Item>
    </>
  );
}

// ---- Paso 5: ¿Nos recomendarías? ----
export function RecommendStep({ state, update, errors, headingRef }: StepProps) {
  return (
    <>
      <StepHeading
        eyebrow="Paso cinco"
        title="¿Nos recomendarías?"
        lead="Del 0 al 10, ¿qué tan probable es que le recomiendes La Bodega a un amigo o familiar?"
        headingRef={headingRef}
      />
      <Item className="flex flex-col gap-3">
        <NpsScale
          value={state.recommend}
          onChange={(n) => update({ recommend: n })}
          ariaLabel="Probabilidad de recomendarnos, de 0 a 10"
          invalid={Boolean(errors.recommend)}
          describedBy={errors.recommend ? errId("recommend") : undefined}
        />
        <div className="flex justify-between text-[13px] font-medium uppercase tracking-[0.12em] text-label">
          <span>Nada probable</span>
          <span>Muy probable</span>
        </div>
        <FieldError id={errId("recommend")} message={errors.recommend} />
      </Item>
    </>
  );
}

// ---- Gracias ----
export function DoneStep({
  branchName,
  result,
  hasSession,
  showBridge,
  reviewUrl,
  headingRef,
  onBridge,
  onRestart,
}: {
  branchName: string;
  result: SurveyResult | null;
  hasSession: boolean;
  showBridge: boolean;
  reviewUrl: string | null;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBridge: () => void;
  onRestart: () => void;
}) {
  const points = result?.pointsAwarded ?? 0;
  return (
    <>
      <Item className="flex flex-col items-center gap-4 pt-3 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className="flex h-[74px] w-[74px] items-center justify-center rounded-full font-serif text-[36px] text-[#2a0f07]"
          style={{ background: "linear-gradient(135deg, var(--lb-gold-hi), var(--lb-coral))" }}
          aria-hidden="true"
        >
          B
        </motion.div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="m-0 text-[48px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream outline-none"
        >
          ¡Gracias!
        </h2>
        <p className={cls.eyebrowSerif}>
          Tu opinión ya está con el equipo{branchName ? ` de ${branchName}` : ""}.
        </p>
      </Item>

      {/* Puente a queja: va primero porque es lo más importante para quien la pasó mal. */}
      {showBridge && (
        <Item>
          <div className="flex flex-col gap-3 rounded-[18px] border border-[rgba(255,106,61,0.4)] bg-[rgba(255,106,61,0.1)] p-5">
            <p className="text-[17px] leading-[1.5] text-cream">
              Sentimos que no fue lo que esperabas. ¿Quieres que un encargado te contacte para
              resolverlo?
            </p>
            <div>
              <Button variant="popCoral" size="popMd" onClick={onBridge} className="gap-2">
                Sí, quiero que me contacten
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Item>
      )}

      {hasSession ? (
        <Item>
          {points > 0 ? (
            <div className="pop-points">
              <span className="pop-points__seal" aria-hidden="true">
                <Sparkles size={20} strokeWidth={2.2} />
              </span>
              <div className="flex flex-col">
                <span className="text-[26px] font-semibold uppercase leading-none tracking-[0.01em]">
                  +{points} puntos
                </span>
                <span className="text-[13px] font-medium uppercase tracking-[0.16em] opacity-80">
                  Bodega Club
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center font-serif text-[19px] italic text-muted-ink">
              Ya sumaste tus puntos de hoy, ¡gracias por volver a opinar!
            </p>
          )}
        </Item>
      ) : (
        <Item>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-hair-div bg-[var(--lb-input)] p-4">
            <p className="flex min-w-0 flex-1 basis-[220px] items-start gap-2.5 text-[16px] leading-[1.45] text-body">
              <Gift size={20} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0 text-gold-accent" />
              ¿Sabías que los socios de Bodega Club suman puntos por opinar?
            </p>
            <Button variant="pop" size="popSm" render={<Link href="/bodega-club" />} className="min-h-11 gap-2">
              Unirme
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </Item>
      )}

      {reviewUrl && (
        <Item className="flex justify-center">
          <Button
            variant="popGhost"
            size="popMd"
            render={<a href={reviewUrl} target="_blank" rel="noopener noreferrer" />}
            className="gap-2"
          >
            <Star aria-hidden="true" />
            Déjanos una reseña en Google
            <ExternalLink aria-hidden="true" />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </Button>
        </Item>
      )}

      <Item className="flex justify-center border-t border-hair-div pt-5">
        <button
          type="button"
          onClick={onRestart}
          className="min-h-11 px-3 text-[15px] font-medium text-muted-ink underline-offset-4 transition-colors hover:text-cream hover:underline"
        >
          Enviar otra respuesta
        </button>
      </Item>
    </>
  );
}

