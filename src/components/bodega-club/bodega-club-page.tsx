"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarHeart,
  Check,
  Coffee,
  Gift,
  Moon,
  QrCode,
  Sparkles,
  Store,
  Sun,
  WalletCards,
  WalletMinimal,
} from "lucide-react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Photo } from "@/components/landing/photo";
import heroImage from "../../../public/bodega-club/hero-bodega-club.webp";
import rewardsImage from "../../../public/bodega-club/recompensas-bodega-club.webp";
import communityImage from "../../../public/bodega-club/comunidad-bodega-club.webp";
import { BENEFITS, FAQS } from "./club-data";
import { RewardsChart } from "./rewards-chart";
import { RegistrationDialog } from "./registration-dialog";

type Theme = "day" | "night";

const EASE = [0.22, 1, 0.36, 1] as const;

// Curated Unsplash food stock, reused across the page. Swap for branded shots
// by dropping files in /public and pointing these at their absolute paths.
const IMG = {
  register: "1554118811-1e0d58224f24",
  earn: "1509440159596-0249088772ff",
  redeem: "1549931319-a545dcf3bc73",
} as const;

const heroGroup: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.08, staggerChildren: 0.09 } },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.72, ease: EASE } },
};

function useClubTheme() {
  const [theme, setTheme] = useState<Theme>("day");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("labodega-theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "day" || saved === "night") setTheme(saved);
    } catch {
      // The theme still works with the day default when storage is unavailable.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "day" ? "night" : "day";
      try {
        localStorage.setItem("labodega-theme", next);
      } catch {
        // Storage is optional; keep the in-memory theme.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}

/** Counts from 0 to `to` once the element scrolls into view. */
function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sin animación: salta directo al valor final
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration: 1,
      ease: EASE,
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

function ClubNav({
  theme,
  onToggleTheme,
  onJoin,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  onJoin: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <header className="club-nav sticky top-0 z-40 border-b border-hair-div">
      <nav className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="La Bodega, página principal">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1a120b]">
            <Image src="/logo-bodega.png" alt="" width={28} height={28} className="size-7 object-contain" />
          </span>
          <span className="hidden flex-col leading-none min-[430px]:flex">
            <span className="text-lg font-bold uppercase tracking-[0.06em] text-cream">La Bodega</span>
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-label">
              Panadería · Restaurante
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <Link href="/" className="club-nav-link">Inicio</Link>
          <a href="#beneficios" className="club-nav-link">Recompensas</a>
          <a href="#experiencias" className="club-nav-link">Experiencias</a>
          <span className="club-nav-link is-active" aria-current="page">Bodega Club</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "day" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            className="club-icon-button"
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
          <Button variant="popCoral" size="popSm" className="shadow-none" onClick={onJoin}>
            Únete al club
          </Button>
        </div>
      </nav>
    </header>
  );
}

function ClubHero({ onJoin }: { onJoin: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -28]);

  return (
    <section ref={sectionRef} className="club-hero mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 md:min-h-[calc(90dvh-4.25rem)] md:grid-cols-[0.82fr_1.18fr] md:px-5 md:py-10">
      <motion.div
        variants={heroGroup}
        initial={reduce ? false : "hidden"}
        animate="show"
        className="relative z-10 flex flex-col items-start"
      >
        <motion.p variants={heroItem} className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-coral">
          Bodega Club · Programa de fidelidad
        </motion.p>
        <motion.h1
          variants={heroItem}
          className="max-w-[9ch] text-[clamp(3.5rem,7.4vw,6rem)] font-semibold uppercase leading-[0.86] tracking-[-0.025em] text-cream text-balance"
        >
          Todo lo bueno de volver.
        </motion.h1>
        <motion.p variants={heroItem} className="mt-6 max-w-[31rem] text-lg leading-relaxed text-body text-pretty">
          Suma puntos en cada compra y cámbialos por café, pan, postres y experiencias.
        </motion.p>
        <motion.ul variants={heroItem} className="club-hero-chips mt-6 flex flex-wrap gap-2">
          {["Gratis", "Todas las sucursales", "1 punto por $1"].map((chip) => (
            <li key={chip} className="club-hero-chip">
              <Check className="size-3.5 text-coral" aria-hidden="true" />
              {chip}
            </li>
          ))}
        </motion.ul>
        <motion.div variants={heroItem} className="mt-7 flex flex-wrap gap-3">
          <Button variant="popCoral" size="popLg" className="gap-2 shadow-none" onClick={onJoin}>
            Únete al club
            <ArrowRight aria-hidden="true" />
          </Button>
          <Button variant="popGhost" size="popLg" className="shadow-none" render={<a href="#beneficios" />}>
            Ver recompensas
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, clipPath: "inset(0 0 100% 0 round 1rem)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0 0% 0 round 1rem)" }}
        transition={{ duration: 1, delay: 0.12, ease: EASE }}
        className="club-hero-media relative min-h-[26rem] overflow-hidden rounded-2xl md:min-h-[min(45rem,76dvh)]"
      >
        <motion.div className="absolute -inset-y-12 inset-x-0" style={{ y: reduce ? 0 : imageY }}>
          <Image
            src={heroImage}
            alt="Mesa compartida con pan, café, desayuno y platos de La Bodega"
            fill
            priority
            sizes="(max-width: 767px) 100vw, 58vw"
            className="object-cover object-center"
          />
        </motion.div>
        <div className="club-hero-scrim absolute inset-0" aria-hidden="true" />
        <motion.div
          style={{ y: reduce ? 0 : cardY }}
          className="club-member-ticket absolute bottom-4 left-4 max-w-[15rem] rounded-2xl p-4 sm:bottom-6 sm:left-6"
        >
          <div className="flex items-center justify-between gap-3">
            <Image src="/logo-bodega.png" alt="" width={34} height={34} className="size-8 object-contain" />
            <Sparkles className="size-5 text-gold" aria-hidden="true" />
          </div>
          <p className="mt-8 text-2xl font-semibold uppercase leading-none tracking-[0.02em] text-[#fff6ec]">Bodega Club</p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <p className="text-sm text-[rgba(255,246,236,0.76)]">Miembro de la casa</p>
            <p className="font-serif text-2xl leading-none text-gold">
              <CountUp to={340} />
              <span className="ml-1 font-sans text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[rgba(255,246,236,0.6)]">pts</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatBand() {
  const reduce = useReducedMotion();
  const stats = [
    { display: "$0", Icon: WalletMinimal, label: "Membresía gratis, para siempre y en todas las sucursales." },
    { count: 20, suffix: "pts", Icon: Coffee, label: "y ya tomas tu café de la casa: la primera recompensa llega rápido." },
    { count: 4, Icon: Store, label: "formas de sumar puntos: mesa, panadería, para llevar y delivery." },
    { count: 5, Icon: Gift, label: "recompensas listas para elegir, o guarda para algo grande." },
  ];

  return (
    <section aria-label="El club en números" className="club-stats-band">
      <div className="mx-auto grid max-w-7xl gap-y-6 px-4 sm:px-5 md:grid-cols-2 md:gap-y-8 lg:grid-cols-4 lg:gap-y-0">
        {stats.map(({ display, count, suffix, Icon, label }, index) => (
          <motion.div
            key={label}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
            className="club-stat"
          >
            <Icon className="club-stat-icon size-5" strokeWidth={1.8} aria-hidden="true" />
            <p className="club-stat-value">
              {display ?? <CountUp to={count ?? 0} />}
              {suffix ? <span className="club-stat-suffix"> {suffix}</span> : null}
            </p>
            <p className="club-stat-label">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const reduce = useReducedMotion();
  const steps = [
    {
      title: "Regístrate gratis",
      text: "Tu nombre y WhatsApp bastan. Sin tarjetas ni papeles.",
      Icon: WalletCards,
      image: IMG.register,
      alt: "Café recién servido sobre la mesa de La Bodega",
    },
    {
      title: "Suma con cada compra",
      text: "Mesa, panadería, para llevar y delivery. Un punto por cada $1.",
      Icon: QrCode,
      image: IMG.earn,
      alt: "Mostrador de panadería con pan artesanal",
    },
    {
      title: "Canjea lo que te gusta",
      text: "Convierte tus visitas en café, pan, postres y experiencias.",
      Icon: Gift,
      image: IMG.redeem,
      alt: "Postre de la casa listo para canjear",
    },
  ];

  return (
    <section className="club-steps-section py-[clamp(2.75rem,5.5vw,4.5rem)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <div className="max-w-[44rem]">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-coral">Cómo funciona</p>
          <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">
            Volver también suma.
          </h2>
        </div>

        <div className="mt-9 grid gap-6 md:grid-cols-3">
          {steps.map(({ title, text, Icon, image, alt }, index) => (
            <motion.article
              key={title}
              initial={reduce ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: index * 0.1, ease: EASE }}
              className="club-step-card"
            >
              <div className="club-step-media relative aspect-[16/10] overflow-hidden rounded-2xl">
                <Photo id={image} alt={alt} w={720} h={450} sizes="(max-width: 767px) 100vw, 33vw" />
                <div className="club-step-scrim absolute inset-0" aria-hidden="true" />
                <span className="club-step-index">0{index + 1}</span>
                <span className="club-step-icon absolute bottom-3 left-3 flex size-11 items-center justify-center rounded-full">
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold uppercase leading-tight text-cream">{title}</h3>
              <p className="mt-2 max-w-[24rem] text-base leading-relaxed text-body">{text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Rewards({ theme }: { theme: Theme }) {
  const reduce = useReducedMotion();

  return (
    <section id="beneficios" className="scroll-mt-24 py-[clamp(2.75rem,5.5vw,4.5rem)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.92fr_1.08fr] md:items-stretch md:px-5 lg:gap-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, clipPath: "inset(6% 4% 6% 4% round 1rem)" }}
          whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 1rem)" }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative aspect-[5/4] overflow-hidden rounded-2xl md:aspect-auto md:min-h-[26rem]"
        >
          <Image
            src={rewardsImage}
            alt="Café, pan, dulce, postre y desayuno como ejemplos de recompensas"
            fill
            sizes="(max-width: 767px) 100vw, 48vw"
            className="object-cover"
          />
          <div className="club-reward-photo-badge">
            <span className="font-serif text-3xl leading-none text-[#fff6ec]">
              <CountUp to={1} />
            </span>
            <span className="text-xs font-semibold uppercase leading-tight tracking-[0.06em] text-[rgba(255,246,236,0.8)]">
              punto por
              <br />
              cada $1
            </span>
          </div>
        </motion.div>

        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-coral">Pasaporte de recompensas</p>
          <h2 className="max-w-[12ch] text-[clamp(2.5rem,5vw,4.5rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">
            Tus puntos saben bien.
          </h2>
          <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-body">
            Desde 20 puntos ya tienes premio. Elige algo alcanzable o guarda para lo grande.
          </p>

          <div className="club-chart-frame mt-6">
            <RewardsChart theme={theme} />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-ink">
            Ejemplos de recompensas. Un punto ilustrativo por cada dólar consumido.
          </p>
        </div>
      </div>
    </section>
  );
}

function MemberBenefits() {
  const reduce = useReducedMotion();

  return (
    <section className="py-[clamp(2.75rem,5.5vw,4.5rem)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[12ch] text-[clamp(2.5rem,5vw,4.5rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">
            Hay más esperando por ti.
          </h2>
          <p className="max-w-[26rem] text-lg leading-relaxed text-body">
            Ser miembro suma beneficios más allá de los puntos.
          </p>
        </div>
        <div className="club-benefit-grid mt-7 grid gap-4 md:grid-cols-12">
          {BENEFITS.map(({ title, description, Icon, tone, image, imageAlt }, index) => (
            <motion.article
              key={title}
              initial={reduce ? false : { opacity: 0, y: index === 0 ? 24 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.58, delay: index * 0.07, ease: EASE }}
              data-tone={tone}
              className="club-benefit relative overflow-hidden rounded-2xl p-6 sm:p-8"
            >
              {tone === "photo" && image ? (
                <>
                  <Photo id={image} alt={imageAlt ?? ""} w={900} h={640} sizes="(max-width: 767px) 100vw, 55vw" />
                  <div className="club-benefit-scrim absolute inset-0" aria-hidden="true" />
                </>
              ) : null}
              <div className="relative flex h-full flex-col">
                <Icon className="size-6" strokeWidth={1.8} aria-hidden="true" />
                <div className="mt-auto pt-12">
                  <h3 className="max-w-[16ch] text-[clamp(1.65rem,3.2vw,2.5rem)] font-semibold uppercase leading-[0.94] text-balance">
                    {title}
                  </h3>
                  <p className="mt-3 max-w-[28rem] text-base leading-relaxed">{description}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Community() {
  const reduce = useReducedMotion();

  return (
    <section id="experiencias" className="scroll-mt-24 px-3 py-[clamp(2.5rem,5vw,4rem)] sm:px-5">
      <motion.div
        initial={reduce ? false : { opacity: 0, clipPath: "inset(8% 4% 8% 4% round 1rem)" }}
        whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 1rem)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative mx-auto min-h-[34rem] max-w-7xl overflow-hidden rounded-2xl"
      >
        <Image
          src={communityImage}
          alt="Grupo compartiendo una degustación de pan y café con el panadero"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="club-community-scrim absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-14">
          <div className="max-w-[39rem] text-[#fff6ec]">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-[#ffd38a]">Más que venir a comer</p>
            <h2 className="text-[clamp(2.5rem,5.5vw,5rem)] font-semibold uppercase leading-[0.88] tracking-[-0.025em] text-balance">
              La Bodega también se comparte.
            </h2>
            <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-[rgba(255,246,236,0.88)]">
              Degustaciones, talleres y lanzamientos para conocer lo que hacemos y a quienes vuelven a la mesa.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-base font-medium">
              {["Degustaciones", "Talleres", "Lanzamientos", "Encuentros"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <Check className="size-4 text-[#ffd38a]" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function ClubFaq() {
  return (
    <section className="py-[clamp(2.75rem,5.5vw,4.5rem)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[0.72fr_1.28fr] md:px-5 lg:gap-16">
        <div>
          <h2 className="max-w-[9ch] text-[clamp(2.5rem,5vw,4.5rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">
            Lo importante, claro.
          </h2>
          <p className="mt-5 max-w-[24rem] text-lg leading-relaxed text-body">
            El club es gratuito, sencillo y funciona en toda La Bodega.
          </p>
        </div>
        <Accordion defaultValue={["faq-0"]} className="club-faq">
          {FAQS.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`} className="border-hair-div">
              <AccordionTrigger className="rounded-none py-5 text-lg font-semibold text-cream hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-[58ch] pb-5 text-base leading-relaxed text-body">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function ClosingCta({ onJoin }: { onJoin: () => void }) {
  const reduce = useReducedMotion();

  return (
    <section className="px-3 pb-5 sm:px-5">
      <div className="club-closing mx-auto max-w-7xl overflow-hidden rounded-2xl px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end"
        >
          <div>
            <CalendarHeart className="mb-8 size-8 text-[#2a0f07]" strokeWidth={1.8} aria-hidden="true" />
            <h2 className="max-w-[12ch] text-[clamp(3rem,6.4vw,5.75rem)] font-semibold uppercase leading-[0.86] tracking-[-0.025em] text-[#2a0f07] text-balance">
              Tu próxima visita ya puede sumar.
            </h2>
          </div>
          <div className="shrink-0">
            <p className="mb-5 max-w-[21rem] text-lg leading-relaxed text-[#511b0d]">
              Regístrate gratis y recibe tu beneficio de bienvenida.
            </p>
            <Button
              variant="pop"
              size="popLg"
              className="gap-2 bg-[#1a120b] text-[#fff6ec] shadow-none hover:bg-[#2c1b10]"
              onClick={onJoin}
            >
              Únete al club
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ClubFooter() {
  return (
    <footer className="px-5 py-12 sm:py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#1a120b]">
              <Image src="/logo-bodega.png" alt="" width={32} height={32} className="size-8 object-contain" />
            </span>
            <span>
              <span className="block text-xl font-bold uppercase tracking-[0.05em] text-cream">La Bodega</span>
              <span className="block text-sm text-body">Panadería y restaurante</span>
            </span>
          </Link>
          <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-6 gap-y-3 text-base text-body">
            <Link href="/#carta" className="hover:text-cream">Carta</Link>
            <Link href="/#historia" className="hover:text-cream">Historia</Link>
            <Link href="/#visitanos" className="hover:text-cream">Visítanos</Link>
            <Link href="/feedback" className="hover:text-cream">Cuéntanos tu experiencia</Link>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-hair-div pt-6 text-sm text-label">
          <span>Puerto Ordaz, Venezuela</span>
          <span>© 2026 La Bodega</span>
        </div>
      </div>
    </footer>
  );
}

export function BodegaClubPage() {
  const { theme, toggleTheme } = useClubTheme();
  const [registrationOpen, setRegistrationOpen] = useState(false);

  return (
    <div className={`${theme === "day" ? "day " : ""}club-page relative min-h-dvh overflow-x-hidden`}>
      <a href="#club-main" className="club-skip-link">Ir al contenido</a>
      <div className="club-page-background" aria-hidden="true" />
      <div className="relative z-[1]">
        <ClubNav theme={theme} onToggleTheme={toggleTheme} onJoin={() => setRegistrationOpen(true)} />
        <main id="club-main">
          <ClubHero onJoin={() => setRegistrationOpen(true)} />
          <StatBand />
          <HowItWorks />
          <Rewards theme={theme} />
          <MemberBenefits />
          <Community />
          <ClubFaq />
          <ClosingCta onJoin={() => setRegistrationOpen(true)} />
        </main>
        <ClubFooter />
      </div>
      <RegistrationDialog open={registrationOpen} onOpenChange={setRegistrationOpen} theme={theme} />
    </div>
  );
}
