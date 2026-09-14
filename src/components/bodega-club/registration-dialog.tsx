"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, LoaderCircle, PartyPopper } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, PREFERENCES } from "./club-data";
import {
  submitClubRegistration,
  type ClubRegistrationPayload,
} from "./submit-registration";

type FieldErrors = Partial<Record<"name" | "whatsapp" | "birthday" | "membership", string>>;
type FormState = ClubRegistrationPayload;

const EMPTY_FORM: FormState = {
  name: "",
  whatsapp: "",
  birthday: "",
  branch: "",
  preferences: [],
  acceptsMembership: false,
  acceptsMarketing: false,
};

function validateName(value: string) {
  return value.trim().length >= 2 ? "" : "Escribe tu nombre para crear la membresía.";
}

function validateWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15
    ? ""
    : "Escribe un número con código de país. Ejemplo: +58 414 123 4567.";
}

function validateBirthday(value: string) {
  if (!value) return "";
  return new Date(`${value}T12:00:00`).getTime() <= Date.now()
    ? ""
    : "La fecha de cumpleaños no puede estar en el futuro.";
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="club-field-error flex items-start gap-1.5 text-sm" role="alert">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

export function RegistrationDialog({
  open,
  onOpenChange,
  theme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: "day" | "night";
}) {
  const reduce = useReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [welcomeReward, setWelcomeReward] = useState("");

  useEffect(() => {
    if (!open) {
      const reset = window.setTimeout(() => {
        setForm(EMPTY_FORM);
        setErrors({});
        setStatus("idle");
        setServerMessage("");
        setWelcomeReward("");
      }, 180);
      return () => window.clearTimeout(reset);
    }
  }, [open]);

  const birthdayMax = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePreference(preference: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      preferences: checked
        ? [...current.preferences, preference]
        : current.preferences.filter((item) => item !== preference),
    }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const nameError = validateName(form.name);
    const whatsappError = validateWhatsapp(form.whatsapp);
    const birthdayError = validateBirthday(form.birthday);
    if (nameError) next.name = nameError;
    if (whatsappError) next.whatsapp = whatsappError;
    if (birthdayError) next.birthday = birthdayError;
    if (!form.acceptsMembership) {
      next.membership = "Acepta el uso necesario de tus datos para crear la membresía.";
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setServerMessage("");

    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }

    setStatus("submitting");
    try {
      const result = await submitClubRegistration({
        ...form,
        name: form.name.trim(),
        whatsapp: form.whatsapp.trim(),
      });
      setWelcomeReward(result.welcomeReward);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setServerMessage(
        error instanceof Error
          ? error.message
          : "No pudimos completar el registro. Inténtalo de nuevo.",
      );
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (status === "submitting" && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={status !== "submitting"}
        overlayClassName="bg-[#090604]/70 backdrop-blur-sm"
        className={`${theme === "day" ? "day " : ""}club-dialog max-h-[calc(100dvh-1rem)] gap-0 overflow-y-auto p-0 sm:max-w-[42rem]`}
      >
        {status === "success" ? (
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="flex min-h-[32rem] flex-col justify-between gap-10 p-6 sm:p-10"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="club-success-mark flex size-14 items-center justify-center rounded-full">
                <PartyPopper className="size-6" aria-hidden="true" />
              </span>
              <span className="club-points-seal font-serif text-2xl italic">+20</span>
            </div>
            <div aria-live="polite">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-coral">
                Registro completado
              </p>
              <DialogTitle className="max-w-[11ch] text-[clamp(2.75rem,8vw,4.5rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">
                Ya eres parte de la casa.
              </DialogTitle>
              <DialogDescription className="mt-5 max-w-[40ch] text-base leading-relaxed text-body">
                Tu bienvenida incluye: {welcomeReward.toLowerCase()}.
              </DialogDescription>
              <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted-ink">
                Esta versión demuestra el flujo. La cuenta quedará activa cuando conectemos el sistema de registro.
              </p>
            </div>
            <Button
              type="button"
              variant="popCoral"
              size="popMd"
              className="w-full shadow-none"
              onClick={() => handleOpenChange(false)}
            >
              Cerrar bienvenida
            </Button>
          </motion.div>
        ) : (
          <div className="p-5 sm:p-8">
            <DialogHeader className="pr-10">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-coral">
                Bodega Club
              </p>
              <DialogTitle className="text-[clamp(2.25rem,7vw,3.75rem)] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-cream text-balance">
                Únete gratis.
              </DialogTitle>
              <DialogDescription className="max-w-[44ch] text-base leading-relaxed text-body">
                Tu nombre y WhatsApp bastan para empezar. Los demás datos nos ayudan a darte mejores beneficios.
              </DialogDescription>
            </DialogHeader>

            <form ref={formRef} className="mt-7 grid gap-5" noValidate onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label htmlFor="club-name" className="club-field-label">Nombre completo</label>
                <Input
                  id="club-name"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  onBlur={() => setErrors((current) => ({ ...current, name: validateName(form.name) || undefined }))}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "club-name-error" : undefined}
                  className="club-form-control"
                  placeholder="Ejemplo: Andrea Salazar"
                  disabled={status === "submitting"}
                />
                <FieldError id="club-name-error">{errors.name}</FieldError>
              </div>

              <div className="grid gap-2">
                <label htmlFor="club-whatsapp" className="club-field-label">WhatsApp</label>
                <Input
                  id="club-whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.whatsapp}
                  onChange={(event) => updateField("whatsapp", event.target.value)}
                  onBlur={() => setErrors((current) => ({ ...current, whatsapp: validateWhatsapp(form.whatsapp) || undefined }))}
                  aria-invalid={Boolean(errors.whatsapp)}
                  aria-describedby={errors.whatsapp ? "club-whatsapp-error" : "club-whatsapp-help"}
                  className="club-form-control"
                  placeholder="+58 414 123 4567"
                  disabled={status === "submitting"}
                />
                <p id="club-whatsapp-help" className="text-sm text-muted-ink">
                  Este número identificará tus compras y tus puntos.
                </p>
                <FieldError id="club-whatsapp-error">{errors.whatsapp}</FieldError>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="club-birthday" className="club-field-label">Cumpleaños, opcional</label>
                  <Input
                    id="club-birthday"
                    name="birthday"
                    type="date"
                    max={birthdayMax}
                    value={form.birthday}
                    onChange={(event) => updateField("birthday", event.target.value)}
                    onBlur={() => setErrors((current) => ({ ...current, birthday: validateBirthday(form.birthday) || undefined }))}
                    aria-invalid={Boolean(errors.birthday)}
                    aria-describedby={errors.birthday ? "club-birthday-error" : undefined}
                    className="club-form-control"
                    disabled={status === "submitting"}
                  />
                  <FieldError id="club-birthday-error">{errors.birthday}</FieldError>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="club-branch" className="club-field-label">Sucursal favorita, opcional</label>
                  <Select
                    name="branch"
                    value={form.branch || null}
                    onValueChange={(value) => updateField("branch", value ?? "")}
                    disabled={status === "submitting"}
                  >
                    <SelectTrigger id="club-branch" className="club-form-control w-full">
                      <SelectValue placeholder="Elige una sucursal" />
                    </SelectTrigger>
                    <SelectContent className={`${theme === "day" ? "day " : ""}club-select-content`}>
                      {BRANCHES.map((branch) => (
                        <SelectItem key={branch} value={branch} className="club-select-item">
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <fieldset className="grid gap-3">
                <legend className="club-field-label">Lo que más disfrutas, opcional</legend>
                <div className="flex flex-wrap gap-2">
                  {PREFERENCES.map((preference) => {
                    const checked = form.preferences.includes(preference);
                    return (
                      <label key={preference} className="club-preference" data-checked={checked}>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => togglePreference(preference, next)}
                          disabled={status === "submitting"}
                          className="sr-only"
                        />
                        <Check className="size-3.5" aria-hidden="true" />
                        {preference}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-3 pt-1">
                <label className="club-consent" data-error={Boolean(errors.membership)}>
                  <Checkbox
                    checked={form.acceptsMembership}
                    onCheckedChange={(checked) => {
                      updateField("acceptsMembership", checked);
                      if (checked) setErrors((current) => ({ ...current, membership: undefined }));
                    }}
                    aria-invalid={Boolean(errors.membership)}
                    disabled={status === "submitting"}
                  />
                  <span>Acepto que La Bodega use estos datos para gestionar mi membresía.</span>
                </label>
                <FieldError id="club-membership-error">{errors.membership}</FieldError>

                <label className="club-consent">
                  <Checkbox
                    checked={form.acceptsMarketing}
                    onCheckedChange={(checked) => updateField("acceptsMarketing", checked)}
                    disabled={status === "submitting"}
                  />
                  <span>Quiero recibir beneficios, actividades y novedades por WhatsApp.</span>
                </label>
              </div>

              {status === "error" && (
                <div className="club-submit-error flex items-start gap-2 rounded-xl p-3 text-sm" role="alert">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{serverMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="popCoral"
                size="popLg"
                className="mt-1 w-full shadow-none"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    Enviando registro
                  </>
                ) : status === "error" ? (
                  "Intentar de nuevo"
                ) : (
                  "Crear mi membresía"
                )}
              </Button>
              <p className="text-center text-sm leading-relaxed text-muted-ink" aria-live="polite">
                {status === "submitting" ? "Estamos preparando tu bienvenida." : "Tus datos no se guardan en esta demostración."}
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
