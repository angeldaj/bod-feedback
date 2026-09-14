"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CakeSlice,
  ChefHat,
  Clock,
  Coffee,
  Croissant,
  Heart,
  MapPin,
  Moon,
  Phone,
  Quote,
  Star,
  Sun,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

type Theme = "day" | "night";
import { Button } from "@/components/ui/button";
import { Photo } from "./photo";

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Scroll-reveal wrapper: staggers its children in as it enters the viewport. */
function Reveal({
  children,
  className,
  amount = 0.25,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------------------------------------------- Nav ---- */
const NAV_LINKS = [
  { href: "#carta", label: "Carta" },
  { href: "#historia", label: "Historia" },
  { href: "#galeria", label: "Galería" },
  { href: "#visitanos", label: "Visítanos" },
  { href: "/bodega-club", label: "Bodega Club" },
];

function Nav({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const reduce = useReducedMotion();
  return (
    <header className="lp-nav sticky top-0 z-50 w-full border-b border-hair-div backdrop-blur-xl">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 max-[560px]:px-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a120b]">
            {/* eslint-disable-next-line @next/next/no-img-element -- asset local */}
            <img src="/logo-bodega.png" alt="" className="h-7 w-7 object-contain" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-[18px] font-bold uppercase tracking-[0.06em] text-cream">
              La Bodega
            </span>
            <span className="text-[9.5px] font-medium uppercase tracking-[0.24em] text-label">
              Panadería · Restaurante
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-body transition-colors hover:bg-[color-mix(in_oklab,var(--lb-cream)_8%,transparent)] hover:text-cream"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "day" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            title={theme === "day" ? "Modo oscuro" : "Modo claro"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hair-div text-body transition-colors hover:border-coral hover:text-cream"
          >
            <motion.span
              key={theme}
              initial={reduce ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="inline-flex"
            >
              {theme === "day" ? (
                <Moon size={17} strokeWidth={2} aria-hidden="true" />
              ) : (
                <Sun size={17} strokeWidth={2} aria-hidden="true" />
              )}
            </motion.span>
          </button>

          <Button
            variant="pop"
            size="popSm"
            className="gap-1.5"
            render={<Link href="/feedback" />}
          >
            Deja tu opinión
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </header>
  );
}

/* --------------------------------------------------------------- Hero ---- */
function Hero() {
  const reduce = useReducedMotion();
  return (
    <section id="top" className="relative">
      {/* Full-bleed photo that fades into the page toward the horizontal edges */}
      <div
        aria-hidden="true"
        className="hero-edge-fade pointer-events-none absolute inset-0 overflow-hidden"
      >
        <motion.div
          initial={reduce ? false : { scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
          className="absolute inset-0"
        >
          <Photo
            id="1414235077428-338989a2e8c0"
            alt="Mesa de La Bodega con pan recién horneado y café"
            w={1900}
            h={1300}
            priority
            sizes="100vw"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,12,5,0.5)_0%,rgba(26,12,5,0.18)_38%,rgba(26,12,5,0.82)_100%)]" />
      </div>

      {/* Content stays inside the column, always on solid (non-faded) photo */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex min-h-[86vh] max-w-7xl flex-col justify-end gap-6 px-5 pb-12 max-[560px]:min-h-[92vh] max-[560px]:gap-5 max-[560px]:px-4 max-[560px]:pb-8"
      >
            <motion.span
              variants={rise}
              className="pop-badge w-fit bg-[rgba(26,12,5,0.4)] text-[12px] uppercase tracking-[0.18em] text-[rgba(255,244,232,0.92)] ring-1 ring-[rgba(255,244,232,0.3)] backdrop-blur-md"
            >
              <Wheat size={14} strokeWidth={2} aria-hidden="true" />
              Panadería · Restaurante · Puerto Ordaz
            </motion.span>

            <motion.h1
              variants={rise}
              className="max-w-[16ch] text-[clamp(52px,9vw,108px)] font-semibold uppercase leading-[0.86] tracking-[0.01em] text-[#fff6ec] text-balance"
            >
              Pan del día,
              <br />
              cocina de casa.
            </motion.h1>

            <motion.p
              variants={rise}
              className="max-w-[52ch] text-[clamp(16px,2.1vw,20px)] leading-[1.5] text-[rgba(255,244,232,0.88)] text-pretty"
            >
              Desayunos, almuerzos y postres recién hechos en Puerto Ordaz, con
              el pan horneado cada mañana.
            </motion.p>

            <motion.div variants={rise} className="flex flex-wrap items-center gap-3.5">
              <Button variant="pop" size="popLg" className="gap-2" render={<a href="#carta" />}>
                Ver la carta
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button
                variant="popGhost"
                size="popLg"
                className="gap-2 border-[rgba(255,244,232,0.45)] text-[#fff6ec] hover:border-[#fff6ec] hover:text-white"
                render={<a href="#visitanos" />}
              >
                <MapPin aria-hidden="true" />
                Cómo llegar
              </Button>
            </motion.div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------ Marquee ---- */
const MARQUEE = [
  "Pan artesanal",
  "Café de origen",
  "Desayunos",
  "Almuerzos caseros",
  "Postres del día",
  "Tortas por encargo",
  "Para llevar",
];

function Marquee() {
  const group = (
    <div className="lp-marquee-group" aria-hidden="true">
      {MARQUEE.map((m, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 text-[clamp(22px,3.4vw,38px)] font-semibold uppercase tracking-[0.02em] text-cream">
            {m}
          </span>
          <Wheat size={20} strokeWidth={2} className="text-coral" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
  return (
    <section className="lp-marquee-wrap edge-fade-x overflow-hidden border-y border-hair-div py-6">
      <div className="lp-marquee">
        {group}
        {group}
      </div>
      <span className="sr-only">
        La Bodega: pan artesanal, café de origen, desayunos, almuerzos caseros,
        postres, tortas por encargo y para llevar.
      </span>
    </section>
  );
}

/* -------------------------------------------------------------- Carta ---- */
type CartaItem = {
  name: string;
  line: string;
  id: string;
  Icon: LucideIcon;
  big?: boolean;
};
const CARTA: CartaItem[] = [
  { name: "Panadería", line: "Pan artesanal horneado cada mañana", id: "1509440159596-0249088772ff", Icon: Wheat, big: true },
  { name: "Café", line: "De origen, recién molido", id: "1495474472287-4d71bcdd2085", Icon: Coffee },
  { name: "Postres", line: "Tortas, cachitos y dulces", id: "1565958011703-44f9829ba187", Icon: CakeSlice },
  { name: "Desayunos", line: "Para empezar bien el día", id: "1533089860892-a7c6f0a88666", Icon: Croissant },
  { name: "Almuerzos", line: "Cocina de casa, todos los días", id: "1567620905732-2d1ec7ab7445", Icon: UtensilsCrossed },
];

function CartaCard({ item }: { item: CartaItem }) {
  const { name, line, id, Icon, big } = item;
  return (
    <motion.a
      href="#visitanos"
      variants={rise}
      className={
        "group relative block overflow-hidden rounded-3xl " +
        (big
          ? "col-span-2 max-[560px]:aspect-[4/3] md:row-span-2"
          : "max-[560px]:aspect-[4/3]")
      }
    >
      <Photo
        id={id}
        alt={name}
        w={big ? 900 : 700}
        h={big ? 1100 : 560}
        sizes={big ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
        className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,12,5,0.05)_35%,rgba(26,12,5,0.78)_100%)]" />
      <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(26,12,5,0.42)] text-[#ffd9a8] ring-1 ring-[rgba(255,244,232,0.3)] backdrop-blur-md">
        <Icon size={19} strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <div>
          <div className={"font-semibold uppercase leading-none tracking-[0.01em] text-[#fff6ec] " + (big ? "text-[34px]" : "text-[24px]")}>
            {name}
          </div>
          <div className="mt-2 text-[14px] leading-snug text-[rgba(255,244,232,0.82)]">
            {line}
          </div>
        </div>
        <span className="mb-1 flex h-9 w-9 shrink-0 translate-y-1 items-center justify-center rounded-full bg-[#fff6ec] text-[#1a120b] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={18} strokeWidth={2.2} aria-hidden="true" />
        </span>
      </div>
    </motion.a>
  );
}

function Carta() {
  return (
    <section id="carta" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 max-[560px]:px-4 max-[560px]:py-16">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <motion.h2
          variants={rise}
          className="max-w-[16ch] text-[clamp(36px,6vw,64px)] font-semibold uppercase leading-[0.9] tracking-[0.01em] text-cream text-balance"
        >
          Lo que sale del horno
        </motion.h2>
        <motion.p variants={rise} className="max-w-[38ch] text-[17px] leading-[1.5] text-body">
          Todo hecho en casa, cada día. Pasa por cualquiera de nuestras tres
          sucursales y elige lo tuyo.
        </motion.p>
      </Reveal>

      <Reveal
        amount={0.15}
        className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-[repeat(2,minmax(240px,1fr))]"
      >
        {CARTA.map((item) => (
          <CartaCard key={item.name} item={item} />
        ))}
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------- Especialidad ---- */
function Especialidad() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 max-[560px]:px-4">
      <Reveal className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
        <motion.div variants={rise} className="relative order-2 aspect-[5/4] overflow-hidden rounded-[32px] md:order-1">
          <Photo
            id="1555507036-ab1f4038808a"
            alt="Masa madre y hojaldre recién horneados"
            w={1100}
            h={880}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>

        <div className="order-1 flex flex-col items-start gap-5 md:order-2">
          <motion.span variants={rise} className="text-[12px] font-semibold uppercase tracking-[0.2em] text-coral">
            La especialidad
          </motion.span>
          <motion.h2
            variants={rise}
            className="text-[clamp(34px,5vw,58px)] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-cream text-balance"
          >
            Masa madre,
            <br />
            24 horas de paciencia.
          </motion.h2>
          <motion.p variants={rise} className="max-w-[46ch] text-[18px] leading-[1.55] text-body">
            Fermentamos lento para que cada pieza salga con corteza crujiente y
            miga tierna. La misma receta desde el primer día, sin atajos.
          </motion.p>
          <motion.span
            variants={rise}
            className="pop-badge bg-gold-hi/20 text-[13px] uppercase tracking-[0.08em] text-gold-accent ring-1 ring-[rgba(169,118,26,0.3)]"
          >
            <Star size={14} strokeWidth={2.2} className="fill-current" aria-hidden="true" />
            Favorito de la casa
          </motion.span>
        </div>
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------------- Historia ---- */
const VALUES: { Icon: LucideIcon; title: string; line: string }[] = [
  { Icon: MapPin, title: "Tres sucursales", line: "Cerca de ti en Puerto Ordaz." },
  { Icon: Wheat, title: "Pan del día", line: "Horneado cada mañana, sin excepción." },
  { Icon: Heart, title: "Cocina de casa", line: "Recetas de familia, hechas con calma." },
];

function Historia() {
  return (
    <section id="historia" className="scroll-mt-24 px-4 py-20 max-[560px]:px-2.5 max-[560px]:py-14">
      <div className="lp-band mx-auto max-w-7xl overflow-hidden rounded-[36px] px-8 py-16 ring-1 ring-hair-div max-[560px]:px-5 max-[560px]:py-12">
        <Reveal className="mx-auto flex max-w-[720px] flex-col items-center gap-5 text-center">
          <motion.span
            variants={rise}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a120b] text-[#ffd9a8]"
          >
            <ChefHat size={26} strokeWidth={1.9} aria-hidden="true" />
          </motion.span>
          <motion.h2
            variants={rise}
            className="text-[clamp(34px,5.5vw,60px)] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-cream text-balance"
          >
            De familia, para la familia
          </motion.h2>
          <motion.p variants={rise} className="max-w-[58ch] text-[18px] leading-[1.6] text-body text-pretty">
            La Bodega nació de una cocina de casa y un horno que nunca se apaga.
            Hoy somos punto de encuentro del barrio: el pan de la mañana, el café
            de media tarde y la mesa de los domingos.
          </motion.p>
        </Reveal>

        <Reveal amount={0.2} className="mt-12 grid gap-5 sm:grid-cols-3">
          {VALUES.map((v) => (
            <motion.div
              key={v.title}
              variants={rise}
              className="lp-band-card flex flex-col items-center gap-3 rounded-3xl px-6 py-8 text-center ring-1 ring-hair-div"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-soft text-coral">
                <v.Icon size={22} strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="text-[20px] font-semibold uppercase tracking-[0.01em] text-cream">
                {v.title}
              </div>
              <div className="text-[15px] leading-snug text-body">{v.line}</div>
            </motion.div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Galería ---- */
const GALLERY: { id: string; ratio: string; alt: string }[] = [
  { id: "1517248135467-4c7edcad34c4", ratio: "aspect-[3/4]", alt: "El salón de La Bodega" },
  { id: "1608198093002-ad4e005484ec", ratio: "aspect-square", alt: "Panes recién salidos del horno" },
  { id: "1461023058943-07fcbe16d735", ratio: "aspect-[4/5]", alt: "Café de la casa" },
  { id: "1549931319-a545dcf3bc73", ratio: "aspect-[4/3]", alt: "Postres del día" },
  { id: "1546069901-ba9599a7e63c", ratio: "aspect-square", alt: "Almuerzo casero" },
  { id: "1488477181946-6428a0291777", ratio: "aspect-[3/4]", alt: "Bollería artesanal" },
];

function Galeria() {
  return (
    <section id="galeria" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 max-[560px]:px-4 max-[560px]:py-16">
      <Reveal className="mb-10">
        <motion.h2
          variants={rise}
          className="text-[clamp(36px,6vw,64px)] font-semibold uppercase leading-[0.9] tracking-[0.01em] text-cream text-balance"
        >
          Un vistazo a la casa
        </motion.h2>
      </Reveal>

      <Reveal amount={0.1} className="gap-4 [column-count:2] md:[column-count:3]">
        {GALLERY.map((g) => (
          <motion.div
            key={g.id}
            variants={rise}
            className={"group relative mb-4 block break-inside-avoid overflow-hidden rounded-2xl " + g.ratio}
          >
            <Photo
              id={g.id}
              alt={g.alt}
              w={700}
              h={800}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(26,12,5,0.55)_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </motion.div>
        ))}
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------- Testimonios ---- */
const TESTIMONIALS = [
  { q: "El pan de masa madre es el mejor de Puerto Ordaz. Vengo cada sábado sin falta.", name: "Valentina Ríos", role: "Vecina de Alta Vista" },
  { q: "Desayunamos en familia y todo estaba recién hecho. El café, espectacular.", name: "Andrés Belisario", role: "Cliente frecuente" },
  { q: "Encargué una torta de cumpleaños y quedaron encantados. Ya volveré.", name: "Gabriela Mendoza", role: "Puerto Ordaz" },
];

function Testimonios() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 max-[560px]:px-4 max-[560px]:py-10">
      <Reveal className="mb-10">
        <motion.h2
          variants={rise}
          className="text-[clamp(32px,5vw,54px)] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-cream text-balance"
        >
          Lo que dicen en la mesa
        </motion.h2>
      </Reveal>

      <Reveal amount={0.2} className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <motion.figure
            key={t.name}
            variants={rise}
            className="pop-card flex flex-col gap-4 p-7"
          >
            <Quote size={26} strokeWidth={2} className="text-coral" aria-hidden="true" />
            <blockquote className="text-[18px] leading-[1.5] text-cream">
              “{t.q}”
            </blockquote>
            <div className="mt-auto flex items-center gap-0.5" aria-label="5 de 5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={15} strokeWidth={0} className="fill-gold text-gold" aria-hidden="true" />
              ))}
            </div>
            <figcaption className="text-[15px] text-body">
              <span className="font-semibold text-cream">{t.name}</span>
              <span className="text-muted-ink"> · {t.role}</span>
            </figcaption>
          </motion.figure>
        ))}
      </Reveal>
    </section>
  );
}

/* --------------------------------------------------------- Visítanos ---- */
const HOURS = [
  { d: "Lunes a viernes", h: "6:30 – 21:00" },
  { d: "Sábado", h: "7:00 – 22:00" },
  { d: "Domingo", h: "7:00 – 14:00" },
];

function Visitanos() {
  return (
    <section id="visitanos" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 max-[560px]:px-4 max-[560px]:py-14">
      <Reveal className="grid items-stretch gap-8 md:grid-cols-2 md:gap-10">
        <motion.div variants={rise} className="relative min-h-[360px] overflow-hidden rounded-[32px]">
          <Photo
            id="1554118811-1e0d58224f24"
            alt="Fachada de La Bodega en Puerto Ordaz"
            w={1000}
            h={1000}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </motion.div>

        <motion.div variants={rise} className="pop-card flex flex-col gap-7 p-9 max-[560px]:p-6">
          <h2 className="text-[clamp(32px,5vw,52px)] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-cream text-balance">
            Te esperamos
          </h2>

          <div className="flex items-start gap-3">
            <MapPin size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-coral" aria-hidden="true" />
            <div className="text-[16px] leading-[1.5] text-body">
              Av. Las Américas, Puerto Ordaz
              <br />
              Estado Bolívar, Venezuela
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-coral" aria-hidden="true" />
            <ul className="flex-1">
              {HOURS.map((r) => (
                <li
                  key={r.d}
                  className="flex items-center justify-between gap-4 border-b border-hair-div py-2 text-[15px] last:border-0"
                >
                  <span className="text-body">{r.d}</span>
                  <span className="font-medium text-cream">{r.h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Phone size={20} strokeWidth={2} className="shrink-0 text-coral" aria-hidden="true" />
            <a href="tel:+582865550142" className="text-[16px] font-medium text-cream underline-offset-4 hover:underline">
              +58 286 555 0142
            </a>
          </div>

          <Button
            variant="pop"
            size="popMd"
            className="mt-1 w-fit gap-2"
            render={
              <a
                href="https://www.google.com/maps/search/?api=1&query=La+Bodega+Puerto+Ordaz"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Cómo llegar
            <ArrowUpRight aria-hidden="true" />
          </Button>
        </motion.div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------ Feedback CTA ---- */
function FeedbackCTA() {
  const reduce = useReducedMotion();
  return (
    <section className="px-4 pb-8 max-[560px]:px-2.5">
      <div className="lp-sheen relative mx-auto max-w-7xl overflow-hidden rounded-[36px] px-10 py-16 text-center max-[560px]:px-6 max-[560px]:py-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto flex max-w-[640px] flex-col items-center gap-6"
        >
          <span className="pop-badge bg-[rgba(26,12,5,0.28)] text-[12px] uppercase tracking-[0.14em] text-white ring-1 ring-[rgba(255,255,255,0.35)]">
            <Heart size={14} strokeWidth={2.2} className="fill-current" aria-hidden="true" />
            ¿Ya nos visitaste?
          </span>
          <h2 className="text-[clamp(34px,5.5vw,58px)] font-semibold uppercase leading-[0.9] tracking-[0.01em] text-white text-balance">
            Cuéntanos cómo te fue
          </h2>
          <p className="max-w-[46ch] text-[17px] leading-[1.5] text-[rgba(255,255,255,0.92)]">
            Tu opinión llega directo al equipo de sala y cocina. Menos de dos
            minutos, y anónima si así lo prefieres.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Button
              variant="popGhost"
              size="popLg"
              className="gap-2 border-white/50 bg-white text-[#c8391a] hover:bg-white hover:text-[#a82e12]"
              render={<Link href="/feedback" />}
            >
              Deja tu opinión
              <ArrowRight aria-hidden="true" />
            </Button>
            <Link
              href="/feedback?tab=urgente"
              className="text-[14px] font-semibold text-white underline-offset-4 hover:underline"
            >
              ¿Algo urgente? Repórtalo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Footer ---- */
const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Facebook", href: "https://facebook.com" },
  { label: "WhatsApp", href: "https://wa.me/582865550142" },
];

function Footer() {
  return (
    <footer className="border-t border-hair-div px-5 py-14 max-[560px]:px-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a120b]">
              {/* eslint-disable-next-line @next/next/no-img-element -- asset local */}
              <img src="/logo-bodega.png" alt="" className="h-8 w-8 object-contain" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[20px] font-bold uppercase tracking-[0.06em] text-cream">
                La Bodega
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-label">
                Panadería · Restaurante
              </span>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[15px] text-body transition-colors hover:text-cream">
                {l.label}
              </a>
            ))}
            <Link href="/feedback" className="text-[15px] text-body transition-colors hover:text-cream">
              Encuesta
            </Link>
          </nav>

          <div className="flex flex-wrap gap-2.5">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-hair-div px-4 py-2 text-[14px] font-medium text-body transition-colors hover:border-coral hover:text-cream"
              >
                {s.label}
                <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair-div pt-6 text-[13px] uppercase tracking-[0.14em] text-label">
          <span>Av. Las Américas · Puerto Ordaz · Venezuela</span>
          <span>© {"2026"} La Bodega</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------- Landing ---- */
export function Landing() {
  const [theme, setTheme] = useState<Theme>("day");

  // Restaura la preferencia (día por defecto). Comparte la key con /feedback.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("labodega-theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "day" || saved === "night") setTheme(saved);
    } catch {
      /* no-op */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "day" ? "night" : "day";
      try {
        localStorage.setItem("labodega-theme", next);
      } catch {
        /* no-op */
      }
      return next;
    });
  }, []);

  return (
    <div className={(theme === "day" ? "day " : "") + "relative min-h-dvh overflow-x-hidden"}>
      <div aria-hidden="true" className="pop-page-base" />
      <div className="relative z-[1]">
        <Nav theme={theme} onToggleTheme={toggleTheme} />
        <main>
          <Hero />
          <Marquee />
          <Carta />
          <Especialidad />
          <Historia />
          <Galeria />
          <Testimonios />
          <Visitanos />
          <FeedbackCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
