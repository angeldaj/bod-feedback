"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Eye, EyeOff, LoaderCircle, PartyPopper } from "lucide-react";
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
import { isCedula } from "@/components/auth/login-experience";
import { useBranches } from "@/lib/use-branches";
import { useMember } from "@/lib/member-session";
import { PREFERENCES } from "./club-data";
import {
  submitClubRegistration,
  type ClubRegistrationPayload,
} from "./submit-registration";

type FieldErrors = Partial<
  Record<"name" | "whatsapp" | "birthday" | "membership" | "cedula" | "email" | "password" | "username", string>
>;
type FormState = ClubRegistrationPayload;

const EMPTY_FORM: FormState = {
  name: "",
  nationality: "V",
  cedula: "",
  whatsapp: "",
  email: "",
  password: "",
  username: "",
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

function validateCedula(nationality: "V" | "E", cedula: string) {
  return isCedula(`${nationality}${cedula}`) ? "" : "Escribe tu cédula: solo números, 6 a 9 dígitos.";
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Escribe un correo válido.";
}

function validatePassword(value: string) {
  return value.length >= 6 ? "" : "Tu contraseña necesita al menos 6 caracteres.";
}

function validateUsername(value: string) {
  if (!value) return "";
  return /^[a-zA-Z0-9._-]{3,}$/.test(value)
    ? ""
    : "Usa letras, números, puntos o guiones, sin espacios.";
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
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { branches, loading: branchesLoading } = useBranches();
  const { adoptSession } = useMember();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [welcomeReward, setWelcomeReward] = useState("");
  const [welcomeBonus, setWelcomeBonus] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) {
      const reset = window.setTimeout(() => {
        setForm(EMPTY_FORM);
        setErrors({});
        setStatus("idle");
        setServerMessage("");
        setWelcomeReward("");
        setWelcomeBonus(0);
        setShowPassword(false);
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
    const cedulaError = validateCedula(form.nationality, form.cedula);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);
    const usernameError = validateUsername(form.username);
    if (nameError) next.name = nameError;
    if (whatsappError) next.whatsapp = whatsappError;
    if (birthdayError) next.birthday = birthdayError;
    if (cedulaError) next.cedula = cedulaError;
    if (emailError) next.email = emailError;
    if (passwordError) next.password = passwordError;
    if (usernameError) next.username = usernameError;
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
        cedula: form.cedula.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
      });
      adoptSession(result.session);
      setWelcomeReward(result.welcomeReward);
      setWelcomeBonus(result.welcomeBonus);
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
              <span className="club-points-seal font-serif text-2xl italic">+{welcomeBonus}</span>
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
                Tu sesión ya quedó iniciada. Entra a Mi Club para ver tu tarjeta, tus puntos y las recompensas disponibles.
              </p>
            </div>
            <Button
              type="button"
              variant="popCoral"
              size="popMd"
              className="w-full shadow-none"
              onClick={() => {
                handleOpenChange(false);
                router.push("/mi-club");
              }}
            >
              Ir a Mi Club
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
                Nombre, cédula, WhatsApp, correo y una contraseña bastan para empezar. Los demás datos nos ayudan a darte mejores beneficios.
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

              <div className="grid gap-5 sm:grid-cols-[7rem_1fr]">
                <div className="grid gap-2">
                  <label htmlFor="club-nationality" className="club-field-label">Nacionalidad</label>
                  <Select
                    name="nationality"
                    value={form.nationality}
                    onValueChange={(value) => updateField("nationality", (value as "V" | "E") ?? "V")}
                    disabled={status === "submitting"}
                  >
                    <SelectTrigger id="club-nationality" className="club-form-control w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={`${theme === "day" ? "day " : ""}club-select-content`}>
                      <SelectItem value="V" className="club-select-item">V</SelectItem>
                      <SelectItem value="E" className="club-select-item">E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="club-cedula" className="club-field-label">Cédula</label>
                  <Input
                    id="club-cedula"
                    name="cedula"
                    inputMode="numeric"
                    autoComplete="off"
                    value={form.cedula}
                    onChange={(event) => updateField("cedula", event.target.value.replace(/\D/g, ""))}
                    onBlur={() =>
                      setErrors((current) => ({
                        ...current,
                        cedula: validateCedula(form.nationality, form.cedula) || undefined,
                      }))
                    }
                    aria-invalid={Boolean(errors.cedula)}
                    aria-describedby={errors.cedula ? "club-cedula-error" : undefined}
                    className="club-form-control"
                    placeholder="12345678"
                    disabled={status === "submitting"}
                  />
                  <FieldError id="club-cedula-error">{errors.cedula}</FieldError>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="club-email" className="club-field-label">Correo</label>
                  <Input
                    id="club-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    onBlur={() => setErrors((current) => ({ ...current, email: validateEmail(form.email) || undefined }))}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "club-email-error" : undefined}
                    className="club-form-control"
                    placeholder="tú@correo.com"
                    disabled={status === "submitting"}
                  />
                  <FieldError id="club-email-error">{errors.email}</FieldError>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="club-username" className="club-field-label">Usuario, opcional</label>
                  <Input
                    id="club-username"
                    name="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={(event) => updateField("username", event.target.value)}
                    onBlur={() =>
                      setErrors((current) => ({ ...current, username: validateUsername(form.username) || undefined }))
                    }
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby={errors.username ? "club-username-error" : undefined}
                    className="club-form-control"
                    placeholder="tu.usuario"
                    disabled={status === "submitting"}
                  />
                  <FieldError id="club-username-error">{errors.username}</FieldError>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="club-password" className="club-field-label">Contraseña</label>
                <div className="relative">
                  <Input
                    id="club-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    onBlur={() =>
                      setErrors((current) => ({ ...current, password: validatePassword(form.password) || undefined }))
                    }
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "club-password-error" : "club-password-help"}
                    className="club-form-control pr-10"
                    placeholder="Al menos 6 caracteres"
                    disabled={status === "submitting"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-ink transition-colors hover:text-cream"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </div>
                <p id="club-password-help" className="text-sm text-muted-ink">
                  La usarás para entrar a Mi Club junto con tu cédula o correo.
                </p>
                <FieldError id="club-password-error">{errors.password}</FieldError>
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
                    disabled={status === "submitting" || branchesLoading}
                  >
                    <SelectTrigger id="club-branch" className="club-form-control w-full">
                      <SelectValue placeholder={branchesLoading ? "Cargando sucursales…" : "Elige una sucursal"} />
                    </SelectTrigger>
                    <SelectContent className={`${theme === "day" ? "day " : ""}club-select-content`}>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id} className="club-select-item">
                          {branch.name}
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
                {status === "submitting" ? "Estamos preparando tu bienvenida." : "Tus datos solo se usan para tu membresía en Bodega Club."}
              </p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
