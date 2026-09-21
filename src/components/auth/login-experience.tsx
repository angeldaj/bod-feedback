"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { Photo } from "@/components/landing/photo";
import { useClubTheme } from "@/components/mi-club/use-club-theme";
import { useMember } from "@/lib/member-session";
import { requestPasswordReset } from "@/lib/loyalty-api";

const EASE = [0.22, 1, 0.36, 1] as const;

const BULLETS = [
  "Tus puntos y recompensas, siempre a la mano",
  "Descuentos oficiales y puntos dobles solo para socios",
  "Tu clásico, tu historial y tu tarjeta digital",
] as const;

export function isCedula(value: string) {
  // Venezuelan ID: optional V/E prefix, then 6–9 digits (dots/dashes ignored).
  const normalized = value.trim().replace(/[.\s-]/g, "").toUpperCase();
  return /^[VE]?\d{6,9}$/.test(normalized);
}

/** Login acepta cédula, correo o nombre de usuario (≥3 caracteres). */
function isIdentifier(value: string) {
  const v = value.trim();
  if (v.length < 3) return false;
  return isCedula(v) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^[a-zA-Z0-9._-]+$/.test(v);
}

function LoginAside() {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const tx = useSpring(useTransform(px, [0, 1], [-14, 14]), { stiffness: 120, damping: 20 });
  const ty = useSpring(useTransform(py, [0, 1], [-10, 10]), { stiffness: 120, damping: 20 });
  const ticketX = useSpring(useTransform(px, [0, 1], [10, -10]), { stiffness: 120, damping: 20 });
  const ticketY = useSpring(useTransform(py, [0, 1], [8, -8]), { stiffness: 120, damping: 20 });

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }
  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="login-aside relative hidden min-h-[38rem] lg:flex"
    >
      <motion.div className="absolute -inset-8" style={reduce ? undefined : { x: tx, y: ty }}>
        <Photo
          id="1554118811-1e0d58224f24"
          alt="Mesa de La Bodega con café, pan y desayuno"
          w={900}
          h={1100}
          priority
          sizes="(max-width: 1023px) 0px, 42vw"
        />
      </motion.div>
      <div className="login-aside-scrim absolute inset-0" aria-hidden="true" />

      <div className="relative z-[1] flex w-full flex-col justify-between p-8 lg:p-10">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#1a120b]">
            <Image src="/logo-bodega.png" alt="" width={28} height={28} className="size-7 object-contain" />
          </span>
          <span className="text-lg font-bold uppercase tracking-[0.06em] text-[#fff6ec]">Bodega Club</span>
        </div>

        <motion.div
          style={reduce ? undefined : { x: ticketX, y: ticketY }}
          className="club-member-ticket max-w-[16rem] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <Image src="/logo-bodega.png" alt="" width={34} height={34} className="size-8 object-contain" />
            <Sparkles className="size-5 text-gold" aria-hidden="true" />
          </div>
          <p className="mt-8 text-2xl font-semibold uppercase leading-none tracking-[0.02em] text-[#fff6ec]">
            Bodega Club
          </p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="text-sm text-[rgba(255,246,236,0.76)]">Miembro de la casa</p>
            <p className="font-serif text-2xl leading-none text-gold">
              340
              <span className="ml-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[rgba(255,246,236,0.6)]">
                pts
              </span>
            </p>
          </div>
        </motion.div>

        <div className="relative z-[1] text-[#fff6ec]">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#ffd38a]">
            Área de socios
          </p>
          <h2 className="text-[clamp(2.25rem,3.2vw,3.25rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-balance">
            Bienvenido de vuelta.
          </h2>
          <ul className="mt-5 grid gap-2.5">
            {BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-[15px] leading-snug text-[rgba(255,246,236,0.9)]">
                <Check className="mt-0.5 size-4 shrink-0 text-[#ffd38a]" aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginExperience() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { theme, toggleTheme } = useClubTheme();
  const { login } = useMember();
  const formRef = useRef<HTMLFormElement>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [serverError, setServerError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "submitting" | "sent">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: { identifier?: string; password?: string } = {};
    if (!isIdentifier(identifier)) next.identifier = "Escribe tu cédula, correo o nombre de usuario.";
    if (password.trim().length < 4) next.password = "Tu contraseña necesita al menos 4 caracteres.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    setStatus("submitting");
    try {
      await login(identifier.trim(), password);
      router.push(returnToPath());
    } catch (error) {
      setStatus("idle");
      setServerError(
        error instanceof Error
          ? error.message
          : "No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.",
      );
    }
  }

  function returnToPath(): string {
    if (typeof window === "undefined") return "/mi-club";
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    return returnTo && returnTo.startsWith("/") ? returnTo : "/mi-club";
  }

  async function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEmail(forgotEmail)) {
      setForgotError("Escribe un correo válido.");
      return;
    }
    setForgotError("");
    setForgotStatus("submitting");
    try {
      await requestPasswordReset(forgotEmail.trim());
      setForgotStatus("sent");
    } catch (error) {
      setForgotStatus("idle");
      setForgotError(
        error instanceof Error ? error.message : "No pudimos enviar el correo. Inténtalo de nuevo.",
      );
    }
  }

  const submitting = status === "submitting";

  return (
    <div className={`${theme === "day" ? "day " : ""}mc-page relative min-h-dvh overflow-x-hidden`}>
      <div className="mc-page-background" aria-hidden="true" />
      <div className="relative z-[1] mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-hair-div px-3.5 py-2 text-sm font-medium text-body transition-colors hover:border-coral hover:text-cream"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Inicio
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "day" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            className="mc-icon-button"
          >
            <motion.span
              key={theme}
              initial={reduce ? false : { opacity: 0, rotate: -60, scale: 0.75 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: EASE }}
              className="inline-flex"
            >
              {theme === "day" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
            </motion.span>
          </button>
        </div>

        <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
          <LoginAside />

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="login-card mx-auto w-full max-w-[27rem] p-6 sm:p-9"
          >
            <p className="mc-eyebrow mb-2">Bodega Club</p>
            <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold uppercase leading-[0.92] tracking-[-0.02em] text-cream text-balance">
              {forgotOpen ? "Recupera tu clave." : "Inicia sesión."}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-body">
              {forgotOpen
                ? "Escribe tu correo y te mandamos un enlace para elegir una contraseña nueva."
                : "Entra con tu cédula, correo o usuario para ver tus puntos, recompensas y actividad."}
            </p>

            {forgotOpen ? (
              forgotStatus === "sent" ? (
                <div className="mt-7 grid gap-6" aria-live="polite">
                  <div className="club-success-mark flex size-14 items-center justify-center rounded-full">
                    <Check className="size-6" aria-hidden="true" />
                  </div>
                  <p className="text-base leading-relaxed text-body">
                    Si <span className="font-semibold text-cream">{forgotEmail}</span> tiene una cuenta,
                    llegará un correo con el enlace para cambiar tu contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(false);
                      setForgotStatus("idle");
                      setForgotEmail("");
                    }}
                    className="btn3d btn3d--soft w-full text-[15px]"
                  >
                    <ArrowLeft aria-hidden="true" />
                    Volver a iniciar sesión
                  </button>
                </div>
              ) : (
                <form noValidate onSubmit={submitForgotPassword} className="mt-7 grid gap-5">
                  <div className="grid gap-2">
                    <label htmlFor="forgot-email" className="text-sm font-semibold text-cream">
                      Correo de tu cuenta
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
                      <input
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        value={forgotEmail}
                        onChange={(event) => setForgotEmail(event.target.value)}
                        aria-invalid={Boolean(forgotError)}
                        aria-describedby={forgotError ? "forgot-email-error" : undefined}
                        className="mc-field pl-10"
                        placeholder="tú@correo.com"
                        disabled={forgotStatus === "submitting"}
                      />
                    </div>
                    {forgotError ? (
                      <p id="forgot-email-error" className="club-field-error flex items-center gap-1.5 text-sm" role="alert">
                        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                        {forgotError}
                      </p>
                    ) : null}
                  </div>

                  <button type="submit" disabled={forgotStatus === "submitting"} className="btn3d btn3d--coral mt-1 w-full text-base">
                    {forgotStatus === "submitting" ? (
                      <>
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                        Enviando
                      </>
                    ) : (
                      "Enviar enlace"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="text-center text-sm font-medium text-coral hover:underline"
                  >
                    Volver a iniciar sesión
                  </button>
                </form>
              )
            ) : (
              <>
                <form ref={formRef} noValidate onSubmit={submit} className="mt-7 grid gap-5">
                  <div className="grid gap-2">
                    <label htmlFor="login-identifier" className="text-sm font-semibold text-cream">
                      Cédula, correo o usuario
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
                      <input
                        id="login-identifier"
                        type="text"
                        autoComplete="username"
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        onBlur={() =>
                          setErrors((c) => ({ ...c, identifier: identifier && !isIdentifier(identifier) ? "Escribe tu cédula, correo o nombre de usuario." : undefined }))
                        }
                        aria-invalid={Boolean(errors.identifier)}
                        aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
                        className="mc-field pl-10"
                        placeholder="V-12.345.678, tu@correo.com o tu.usuario"
                        disabled={submitting}
                      />
                    </div>
                    {errors.identifier ? (
                      <p id="login-identifier-error" className="club-field-error flex items-center gap-1.5 text-sm" role="alert">
                        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                        {errors.identifier}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="text-sm font-semibold text-cream">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotOpen(true);
                          setForgotError("");
                        }}
                        className="text-sm font-medium text-coral hover:underline"
                      >
                        ¿La olvidaste?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? "login-password-error" : undefined}
                        className="mc-field px-10"
                        placeholder="••••••••"
                        disabled={submitting}
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
                    {errors.password ? (
                      <p id="login-password-error" className="club-field-error flex items-center gap-1.5 text-sm" role="alert">
                        <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                        {errors.password}
                      </p>
                    ) : null}
                  </div>

                  {serverError ? (
                    <div className="club-submit-error flex items-start gap-2 rounded-xl p-3 text-sm" role="alert">
                      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>{serverError}</span>
                    </div>
                  ) : null}

                  <button type="submit" disabled={submitting} className="btn3d btn3d--coral mt-1 w-full text-base">
                    {submitting ? (
                      <>
                        <LoaderCircle className="animate-spin" aria-hidden="true" />
                        Entrando
                      </>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-body">
                  ¿Aún no eres socio?{" "}
                  <Link href="/bodega-club" className="font-semibold text-coral hover:underline">
                    Únete gratis
                  </Link>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
