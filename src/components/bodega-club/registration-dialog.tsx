"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff, LoaderCircle, PartyPopper } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isCedula } from "@/components/auth/login-experience";
import { useMember } from "@/lib/member-session";
import { submitClubRegistration, type ClubRegistrationPayload } from "./submit-registration";

type FieldErrors = Partial<Record<"cedula" | "email" | "username" | "password" | "confirmPassword", string>>;
type FormState = ClubRegistrationPayload & { confirmPassword: string };
const EMPTY_FORM: FormState = {
  nationality: "V", cedula: "", email: "", username: "", password: "", confirmPassword: "",
};

function validateCedula(nationality: "V" | "E", cedula: string) {
  return isCedula(`${nationality}${cedula}`) ? "" : "Escribe tu cédula: solo números, 6 a 9 dígitos.";
}
function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Escribe un correo válido.";
}
function validatePassword(value: string) {
  return value.length >= 8 ? "" : "Tu contraseña necesita al menos 8 caracteres.";
}
function validateUsername(value: string) {
  return /^[a-zA-Z0-9._-]{3,}$/.test(value.trim()) ? "" : "Usa al menos 3 letras, números, puntos o guiones, sin espacios.";
}

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return <p id={id} className="club-field-error flex items-start gap-1.5 text-sm" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{children}</p>;
}

export function RegistrationDialog({
  open, onOpenChange, theme, referralCode,
}: { open: boolean; onOpenChange: (open: boolean) => void; theme: "day" | "night"; referralCode?: string }) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { adoptSession } = useMember();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "success">("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [welcomeBonus, setWelcomeBonus] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) return;
    const reset = window.setTimeout(() => {
      setForm(EMPTY_FORM); setErrors({}); setStatus("idle"); setServerMessage(""); setWelcomeBonus(0); setShowPassword(false);
    }, 180);
    return () => window.clearTimeout(reset);
  }, [open]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const values: [keyof FieldErrors, string][] = [
      ["cedula", validateCedula(form.nationality, form.cedula)], ["email", validateEmail(form.email)],
      ["username", validateUsername(form.username)], ["password", validatePassword(form.password)],
      ["confirmPassword", form.confirmPassword === form.password ? "" : "Las contraseñas no coinciden."],
    ];
    for (const [key, error] of values) if (error) next[key] = error;
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(); setErrors(nextErrors); setServerMessage("");
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    setStatus("submitting");
    try {
      const result = await submitClubRegistration({
        nationality: form.nationality,
        cedula: form.cedula.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        referralCode,
      });
      adoptSession(result.session); setWelcomeBonus(result.welcomeBonus); setStatus("success");
    } catch (error) {
      setStatus("error");
      setServerMessage(error instanceof Error ? error.message : "No pudimos completar el registro. Inténtalo de nuevo.");
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (status === "submitting" && !nextOpen) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={status !== "submitting"} overlayClassName="bg-[#090604]/70 backdrop-blur-sm" className={`${theme === "day" ? "day " : ""}club-dialog max-h-[calc(100dvh-1rem)] gap-0 overflow-y-auto p-0 sm:max-w-[42rem]`}>
        {status === "success" ? (
          <motion.div initial={reduce ? false : { opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }} className="flex min-h-[32rem] flex-col justify-between gap-10 p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4"><span className="club-success-mark flex size-14 items-center justify-center rounded-full"><PartyPopper className="size-6" aria-hidden="true" /></span><span className="club-points-seal font-serif text-2xl italic">+{welcomeBonus}</span></div>
            <div aria-live="polite"><p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-coral">Registro completado</p><DialogTitle className="max-w-[11ch] text-[clamp(2.75rem,8vw,4.5rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">Ya eres parte de la casa.</DialogTitle><DialogDescription className="mt-5 max-w-[40ch] text-base leading-relaxed text-body">Tu bienvenida incluye {welcomeBonus} puntos listos para canjear en tu primera visita.</DialogDescription><p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted-ink">Tu sesión ya quedó iniciada. Entra a Mi Club para completar tu perfil y ver tus beneficios.</p></div>
            <Button type="button" variant="popCoral" size="popMd" className="w-full shadow-none" onClick={() => { handleOpenChange(false); router.push("/mi-club"); }}>Ir a Mi Club</Button>
          </motion.div>
        ) : (
          <div className="p-5 sm:p-8">
            <DialogHeader className="pr-10"><p className="text-sm font-semibold uppercase tracking-[0.12em] text-coral">Bodega Club</p><DialogTitle className="text-[clamp(2.25rem,7vw,3.75rem)] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-cream text-balance">Únete gratis.</DialogTitle><DialogDescription className="max-w-[44ch] text-base leading-relaxed text-body">Regístrate con tu correo, usuario y cédula. Completa tu perfil después y gana puntos por cada dato.</DialogDescription></DialogHeader>
            <form ref={formRef} className="mt-7 grid gap-5" noValidate onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-[7rem_1fr]"><div className="grid gap-2"><label htmlFor="club-nationality" className="club-field-label">Nacionalidad</label><Select name="nationality" value={form.nationality} onValueChange={(value) => updateField("nationality", (value as "V" | "E") ?? "V")} disabled={status === "submitting"}><SelectTrigger id="club-nationality" className="club-form-control w-full"><SelectValue /></SelectTrigger><SelectContent className={`${theme === "day" ? "day " : ""}club-select-content`}><SelectItem value="V" className="club-select-item">V</SelectItem><SelectItem value="E" className="club-select-item">E</SelectItem></SelectContent></Select></div><div className="grid gap-2"><label htmlFor="club-cedula" className="club-field-label">Cédula</label><Input id="club-cedula" name="cedula" inputMode="numeric" autoComplete="off" value={form.cedula} onChange={(event) => updateField("cedula", event.target.value.replace(/\D/g, ""))} onBlur={() => setErrors((current) => ({ ...current, cedula: validateCedula(form.nationality, form.cedula) || undefined }))} aria-invalid={Boolean(errors.cedula)} aria-describedby={errors.cedula ? "club-cedula-error" : undefined} className="club-form-control" placeholder="12345678" disabled={status === "submitting"} /><FieldError id="club-cedula-error">{errors.cedula}</FieldError></div></div>
              <div className="grid gap-2"><label htmlFor="club-email" className="club-field-label">Correo</label><Input id="club-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} onBlur={() => setErrors((current) => ({ ...current, email: validateEmail(form.email) || undefined }))} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "club-email-error" : undefined} className="club-form-control" placeholder="tú@correo.com" disabled={status === "submitting"} /><FieldError id="club-email-error">{errors.email}</FieldError></div>
              <div className="grid gap-2"><label htmlFor="club-username" className="club-field-label">Usuario</label><Input id="club-username" name="username" autoComplete="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} onBlur={() => setErrors((current) => ({ ...current, username: validateUsername(form.username) || undefined }))} aria-invalid={Boolean(errors.username)} aria-describedby={errors.username ? "club-username-error" : undefined} className="club-form-control" placeholder="tu.usuario" disabled={status === "submitting"} /><FieldError id="club-username-error">{errors.username}</FieldError></div>
              <div className="grid gap-2"><label htmlFor="club-password" className="club-field-label">Contraseña</label><div className="relative"><Input id="club-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} onBlur={() => setErrors((current) => ({ ...current, password: validatePassword(form.password) || undefined }))} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "club-password-error" : "club-password-help"} className="club-form-control pr-10" placeholder="Al menos 8 caracteres" disabled={status === "submitting"} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-ink transition-colors hover:text-cream">{showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}</button></div><p id="club-password-help" className="text-sm text-muted-ink">Usa al menos 8 caracteres para entrar a Mi Club.</p><FieldError id="club-password-error">{errors.password}</FieldError></div>
              <div className="grid gap-2"><label htmlFor="club-confirm-password" className="club-field-label">Confirmar contraseña</label><Input id="club-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} onBlur={() => setErrors((current) => ({ ...current, confirmPassword: form.confirmPassword === form.password ? undefined : "Las contraseñas no coinciden." }))} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "club-confirm-password-error" : undefined} className="club-form-control" placeholder="Repite tu contraseña" disabled={status === "submitting"} /><FieldError id="club-confirm-password-error">{errors.confirmPassword}</FieldError></div>
              {status === "error" && <div className="club-submit-error flex items-start gap-2 rounded-xl p-3 text-sm" role="alert"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{serverMessage}</span></div>}
              <Button type="submit" variant="popCoral" size="popLg" className="mt-1 w-full shadow-none" disabled={status === "submitting"}>{status === "submitting" ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Creando cuenta</> : status === "error" ? "Intentar de nuevo" : "Crear mi membresía"}</Button>
              <p className="text-center text-sm leading-relaxed text-muted-ink" aria-live="polite">{status === "submitting" ? "Estamos preparando tu bienvenida." : "Tus datos se usan para gestionar tu membresía en Bodega Club."}</p>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
