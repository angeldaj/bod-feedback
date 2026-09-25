"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Camera,
  Check,
  Croissant,
  LoaderCircle,
  MessageCircle,
  Receipt,
  Send,
  ShoppingBag,
  Siren,
  Store,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/satisfaccion/chip-group";
import { BrandTextField, BrandTextArea } from "@/components/satisfaccion/brand-field";
import { popStepItem } from "@/components/satisfaccion/motion";
import {
  CHANNELS,
  CHANNEL_LABELS,
  EMERGENCY_CATEGORIES,
  GROUP_OF_CATEGORY,
  INCIDENT_CATALOG,
  formatNational,
  nationalDigits,
  toE164,
  type Channel,
  type IncidentCategory,
} from "@/components/feedback/feedback-catalog";
import {
  FieldError,
  GroupLabel,
  Item,
  Notice,
  StepHeading,
  WizardCard,
} from "@/components/feedback/wizard";
import { MediaUpload } from "./media-upload";
import { AudioRecorder } from "./audio-recorder";
import { PoliciesBox } from "./policies";
import {
  INCIDENT_STEPS,
  INCIDENT_STEP_ANNOUNCE,
  initialIncident,
  type IncidentPrefill,
  type IncidentState,
  type MediaItem,
} from "./incident-data";
import { submitIncident, type IncidentResult } from "@/lib/feedback-api";
import { useBranches } from "@/lib/use-branches";
import { useMember } from "@/lib/member-session";

const CHANNEL_ICON: Record<Channel, LucideIcon> = {
  dine_in: UtensilsCrossed,
  bakery: Croissant,
  takeaway: ShoppingBag,
  delivery: Bike,
};

// El cuadro de políticas se muestra expandido solo la primera vez (por
// dispositivo); después arranca colapsado y se puede reabrir.
const POLICIES_SEEN_KEY = "labodega-queja-politicas-vistas";

function readPoliciesSeen(): boolean {
  try {
    return localStorage.getItem(POLICIES_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

type Field = "branchId" | "channel" | "categories" | "description" | "phone";
type Errors = Partial<Record<Field, string>>;

const errId = (field: Field) => `incident-err-${field}`;

const PHONE_ERROR =
  "Revisa el número: debe ser un celular de 10 dígitos que empiece por 412, 414, 416, 422, 424 o 426.";

export function IncidentExperience({
  prefill,
  onSurvey,
}: {
  /** Datos traídos desde la encuesta (puente o atajo). */
  prefill?: IncidentPrefill;
  /** "Cuando puedas, completa la encuesta": cambia al otro formulario. */
  onSurvey: () => void;
}) {
  const { member, accessToken } = useMember();
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<IncidentState>(() => ({
    ...initialIncident,
    branchId: prefill?.branchId ?? "",
    channel: prefill?.channel ?? "",
    description: prefill?.description ?? "",
  }));
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [descMode, setDescMode] = useState<"text" | "audio">("text");
  const [errors, setErrors] = useState<Errors>({});
  const [policiesOpen, setPoliciesOpen] = useState(() => !readPoliciesSeen());
  const [friction, setFriction] = useState(false);
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<IncidentResult | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);
  const memberFilled = useRef(false);

  const name = INCIDENT_STEPS[step];
  const branchName = branches.find((b) => b.id === state.branchId)?.name ?? "";
  const groups = new Set(state.categories.map((c) => GROUP_OF_CATEGORY[c]));
  const hasHealth = groups.has("health_safety");
  const needsContact = hasHealth || groups.has("charge_order");
  const emergency = state.categories.some((c) => EMERGENCY_CATEGORIES.includes(c));
  const phoneE164 = state.phone ? toE164(state.phone) : null;

  // Socio con sesión: nombre y WhatsApp prellenados desde su cuenta (una vez,
  // y solo si la persona no escribió nada todavía).
  useEffect(() => {
    if (!member || memberFilled.current) return;
    memberFilled.current = true;
    setState((s) => ({
      ...s,
      name: s.name || member.fullName || "",
      phone: s.phone || nationalDigits(member.whatsapp ?? ""),
    }));
  }, [member]);

  function setPolicies(open: boolean) {
    setPoliciesOpen(open);
    if (!open) {
      try {
        localStorage.setItem(POLICIES_SEEN_KEY, "1");
      } catch {
        /* no-op */
      }
    }
  }

  const update = (patch: Partial<IncidentState>) => {
    setState((s) => ({ ...s, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(patch)) delete next[key as Field];
      return next;
    });
  };

  const toggleCategory = (key: IncidentCategory) => {
    const categories = state.categories.includes(key)
      ? state.categories.filter((c) => c !== key)
      : [...state.categories, key];
    update({ categories });
    if (key === "other") setErrors((e) => ({ ...e, description: undefined }));
  };

  function stepErrors(): Errors {
    const out: Errors = {};
    if (name === "where") {
      if (!state.branchId) out.branchId = "Elige la sucursal donde pasó.";
      if (!state.channel) out.channel = "Cuéntanos cómo nos visitaste.";
    }
    if (name === "what") {
      if (state.categories.length === 0) out.categories = "Marca al menos una opción para seguir.";
      if (state.categories.includes("other") && !state.description.trim() && !audio) {
        out.description = "Si eliges “Otro”, cuéntanos qué pasó por escrito o con una nota de voz.";
      }
    }
    if (name === "contact" && state.phone && !phoneE164) out.phone = PHONE_ERROR;
    return out;
  }

  function validate(): boolean {
    const found = stepErrors();
    if (Object.keys(found).length === 0) return true;
    setErrors(found);
    requestAnimationFrame(() => {
      const target = bodyRef.current?.querySelector<HTMLElement>(
        'input[aria-invalid="true"], textarea[aria-invalid="true"], [aria-invalid="true"] [tabindex="0"], [data-invalid="true"]',
      );
      target?.focus();
    });
    return false;
  }

  function next() {
    if (!validate()) return;
    setStep((s) => Math.min(INCIDENT_STEPS.length - 1, s + 1));
  }

  function back() {
    setErrors({});
    setFriction(false);
    setSubmitError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit(skipFriction = false) {
    if (phase === "sending" || !validate()) return;
    // Fricción suave: sin número no podemos avisar ni corregir un cobro. Nunca bloquea.
    if (!skipFriction && needsContact && !state.phone) {
      setFriction(true);
      return;
    }
    setFriction(false);
    setPhase("sending");
    setSubmitError(null);
    try {
      const res = await submitIncident(state, media, audio, {
        surveyId: prefill?.surveyId,
        accessToken,
      });
      setResult(res);
      setPhase("done");
    } catch (err) {
      setPhase("form");
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "No pudimos enviar tu queja. Revisa tu conexión e intenta de nuevo.",
      );
    }
  }

  function reset() {
    media.forEach((m) => URL.revokeObjectURL(m.url));
    setState({ ...initialIncident });
    memberFilled.current = false;
    setMedia([]);
    setAudio(null);
    setDescMode("text");
    setErrors({});
    setFriction(false);
    setSubmitError(null);
    setResult(null);
    setPhase("form");
    setStep(0);
  }

  // ---- Paso 1: ¿Dónde fue? ----
  function renderWhere() {
    const branchIds = branches.map((b) => b.id);
    const branchLabels = Object.fromEntries(branches.map((b) => [b.id, b.name]));
    return (
      <>
        <StepHeading
          eyebrow="Paso uno"
          title="¿Dónde fue?"
          lead="Así llega directo al equipo de esa sucursal."
          headingRef={headingRef}
        />
        <Item className="flex flex-col gap-3">
          <GroupLabel icon={Store}>La sucursal</GroupLabel>
          {branchesLoading ? (
            <p className="text-[14px] text-muted-ink">Cargando sucursales…</p>
          ) : branchesError ? (
            <p role="alert" className="text-[14px] text-coral">
              {branchesError}
            </p>
          ) : (
            <ChipGroup
              variant="branch"
              ariaLabel="Sucursal"
              options={branchIds}
              labels={branchLabels}
              value={state.branchId}
              onSelect={(v) => {
                update({ branchId: v });
                if (policiesOpen) setPolicies(false);
              }}
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
        {state.channel === "delivery" && (
          <Item>
            <BrandTextField
              label="N.º de pedido"
              optional
              autoComplete="off"
              placeholder="Lo encuentras en tu comprobante"
              maxLength={40}
              value={state.orderNumber}
              onChange={(v) => update({ orderNumber: v })}
            />
          </Item>
        )}
      </>
    );
  }

  // ---- Paso 2: ¿Qué pasó? ----
  function renderWhat() {
    const otherRequired = state.categories.includes("other");
    return (
      <>
        <StepHeading
          eyebrow="Paso dos"
          title="¿Qué pasó?"
          lead="Marca todo lo que aplique. No hay queja pequeña: si te molestó, queremos saberlo."
          headingRef={headingRef}
        />

        {INCIDENT_CATALOG.map((g) => (
          <Item key={g.group} className="flex flex-col gap-3">
            {g.group !== "other" && <GroupLabel>{g.label}</GroupLabel>}
            <ChipGroup
              variant="topic"
              tone="danger"
              multi
              checkOnSelected
              ariaLabel={g.label}
              options={g.categories.map((c) => c.key)}
              labels={Object.fromEntries(g.categories.map((c) => [c.key, c.label]))}
              value={state.categories}
              onSelect={(v) => toggleCategory(v as IncidentCategory)}
              invalid={Boolean(errors.categories)}
              describedBy={errors.categories ? errId("categories") : undefined}
            />
            {g.group === "health_safety" && emergency && (
              <Notice tone="alert" icon={Siren} role="alert">
                Si es una emergencia médica, llama al{" "}
                <a href="tel:911" className="font-bold underline underline-offset-2">
                  911
                </a>{" "}
                ahora. Luego cuéntanos aquí.
              </Notice>
            )}
            {g.group === "health_safety" && hasHealth && (
              <Notice icon={Store} role="status">
                ¿Sigues en el local? Avísale a cualquier miembro del equipo.
              </Notice>
            )}
            {g.group === "charge_order" && state.categories.includes("wrong_charge") && (
              <Notice icon={Receipt} role="status">
                Ten a mano tu factura o la referencia del pago.
              </Notice>
            )}
          </Item>
        ))}
        <FieldError id={errId("categories")} message={errors.categories} />

        <Item className="flex flex-col gap-3 border-t border-hair-div pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="m-0 text-[24px] font-semibold uppercase leading-none tracking-[0.01em] text-cream">
              Cuéntanos
              {!otherRequired && (
                <span className="ml-2 align-middle text-[13px] font-medium normal-case tracking-normal text-muted-ink">
                  (opcional)
                </span>
              )}
            </h3>
            <div className="inline-flex rounded-full border border-hair-div bg-[var(--lb-input)] p-1">
              {(["text", "audio"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDescMode(m)}
                  aria-pressed={descMode === m}
                  className={
                    "relative isolate min-h-10 rounded-full px-4 text-[14px] font-medium transition-colors " +
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
          </div>
          {/* Ambos quedan montados: cambiar de modo no borra lo ya escrito o grabado. */}
          <div hidden={descMode !== "text"}>
            <BrandTextArea
              label="Cuéntanoslo como se lo contarías a un amigo"
              rows={4}
              maxLength={5000}
              value={state.description}
              onChange={(v) => update({ description: v })}
              placeholder="Qué pediste, qué encontraste, a qué hora…"
              error={descMode === "text" ? errors.description : undefined}
            />
          </div>
          <div hidden={descMode !== "audio"} className="flex flex-col gap-2">
            <AudioRecorder
              onChange={(blob) => {
                setAudio(blob);
                if (blob) setErrors((e) => ({ ...e, description: undefined }));
              }}
            />
            {descMode === "audio" && <FieldError id={errId("description")} message={errors.description} />}
          </div>
        </Item>

        <Item className="flex flex-col gap-3">
          <GroupLabel icon={Camera}>
            Foto o video <span className="normal-case tracking-normal text-muted-ink">(opcional)</span>
          </GroupLabel>
          <p className="text-[15px] leading-[1.5] text-muted-ink">
            Una foto nos ayuda a resolverlo sin hacerte más preguntas.
          </p>
          <MediaUpload items={media} onChange={setMedia} />
        </Item>
      </>
    );
  }

  // ---- Paso 3: ¿Cómo te contactamos? ----
  function renderContact() {
    return (
      <>
        <StepHeading
          eyebrow="Paso tres"
          title="¿Cómo te contactamos?"
          lead="Déjanos tu WhatsApp para atenderte de inmediato. Un encargado te escribe personalmente, no un robot."
          headingRef={headingRef}
        />
        <Item className="flex flex-col gap-5">
          <BrandTextField
            label="WhatsApp"
            optional
            prefix="+58"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="414 123 4567"
            inputRef={phoneRef}
            value={formatNational(state.phone)}
            onChange={(v) => {
              update({ phone: nationalDigits(v) });
              setFriction(false);
            }}
            onBlur={() => {
              if (state.phone && !toE164(state.phone)) setErrors((e) => ({ ...e, phone: PHONE_ERROR }));
            }}
            hint="Tu WhatsApp es solo para responderte. No lo usamos para publicidad."
            error={errors.phone}
          />
          <BrandTextField
            label="Nombre"
            optional
            autoComplete="name"
            placeholder="¿Cómo te llamamos?"
            maxLength={160}
            value={state.name}
            onChange={(v) => update({ name: v })}
          />
          {member && (
            <p className="flex items-center gap-2 text-[14px] text-muted-ink">
              <UserRound size={15} strokeWidth={2} aria-hidden="true" />
              Tomamos estos datos de tu cuenta de Bodega Club. Puedes cambiarlos.
            </p>
          )}
        </Item>
      </>
    );
  }

  // ---- Gracias ----
  function renderDone() {
    if (!result) return null;
    const withPhone = Boolean(phoneE164);
    const urgentWithPhone = withPhone && result.priority === "urgent";
    const title = urgentWithPhone ? "Ya estamos en eso" : "Gracias por avisarnos";
    const Case = <strong className="font-semibold text-cream">{result.caseNumber}</strong>;
    return (
      <>
        <Item className="flex flex-col items-center gap-4 pt-3 text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 18 }}
            className="flex h-[74px] w-[74px] items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, var(--lb-coral-hi), var(--lb-coral-deep))" }}
            aria-hidden="true"
          >
            <Check size={38} strokeWidth={2.4} className="text-white" />
          </motion.div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="m-0 text-[42px] font-semibold uppercase leading-[0.95] tracking-[0.01em] text-cream outline-none max-[560px]:text-[36px]"
          >
            {title}
          </h2>
          <span className="pop-case" aria-hidden="true">
            {result.caseNumber}
          </span>
          <p className="max-w-[44ch] text-[17px] leading-[1.55] text-body">
            {urgentWithPhone ? (
              <>
                Un encargado{branchName ? ` de ${branchName}` : ""} te escribe por WhatsApp en los
                próximos minutos. Tu caso es el {Case}.
              </>
            ) : withPhone ? (
              <>Te escribimos hoy mismo por WhatsApp. Tu caso es el {Case}.</>
            ) : (
              <>Registramos tu queja y la revisaremos. Tu caso es el {Case}.</>
            )}
          </p>
        </Item>
        <Item className="flex flex-col items-center gap-3 border-t border-hair-div pt-5">
          {!prefill?.surveyId && (
            <Button variant="pop" size="popMd" onClick={onSurvey}>
              Cuando puedas, completa la encuesta
            </Button>
          )}
          <button
            type="button"
            onClick={reset}
            className="min-h-11 px-3 text-[15px] font-medium text-muted-ink underline-offset-4 transition-colors hover:text-cream hover:underline"
          >
            Enviar otra queja
          </button>
        </Item>
      </>
    );
  }

  const isDone = phase === "done";
  const isLast = step === INCIDENT_STEPS.length - 1;
  const sending = phase === "sending";

  return (
    <div ref={bodyRef} className="flex w-full flex-col items-center">
      <WizardCard
        stepKey={isDone ? "done" : name}
        stepLabel={isDone ? "Enviado" : `Paso ${step + 1} de ${INCIDENT_STEPS.length}`}
        progress={isDone ? 1 : step / INCIDENT_STEPS.length}
        tone="urgent"
        announce={isDone ? "Queja enviada" : INCIDENT_STEP_ANNOUNCE[name]}
        headingRef={headingRef}
        top={isDone ? null : <PoliciesBox open={policiesOpen} onOpenChange={setPolicies} />}
      >
        {isDone ? (
          renderDone()
        ) : (
          <>
            {name === "where" && renderWhere()}
            {name === "what" && renderWhat()}
            {name === "contact" && renderContact()}

            <motion.div variants={popStepItem} className="mt-1 flex flex-col gap-4 border-t border-hair-div pt-6">
              {friction && (
                <Notice tone="alert" icon={MessageCircle} role="alert">
                  <p className="font-semibold text-cream">
                    Sin un número no podremos avisarte ni corregir tu cobro. ¿Enviar igual?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <Button
                      variant="popCoral"
                      size="popSm"
                      className="min-h-11"
                      onClick={() => {
                        setFriction(false);
                        phoneRef.current?.focus();
                      }}
                    >
                      Agregar mi número
                    </Button>
                    <Button variant="popGhost" size="popSm" className="min-h-11" onClick={() => submit(true)}>
                      Enviar sin contacto
                    </Button>
                  </div>
                </Notice>
              )}
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
                {isLast ? (
                  <Button
                    variant="popCoral"
                    size="popMd"
                    onClick={() => submit()}
                    disabled={sending}
                    aria-busy={sending || undefined}
                    className="gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? (
                      <>
                        <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        Enviando…
                      </>
                    ) : (
                      <>
                        Enviar mi queja
                        <Send aria-hidden="true" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="popCoral" size="popMd" onClick={next} className="gap-2">
                    Siguiente
                    <ArrowRight aria-hidden="true" />
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </WizardCard>
    </div>
  );
}
