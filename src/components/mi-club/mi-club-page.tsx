"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  AtSign,
  Bell,
  CalendarHeart,
  Check,
  ChevronRight,
  Croissant,
  Flame,
  Gift,
  IdCard,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  QrCode,
  Repeat,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Ticket,
  TrendingUp,
  Truck,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Photo } from "@/components/landing/photo";
import { MembershipCard } from "./membership-card";
import { PointsChart } from "./points-chart";
import { useClubTheme, type Theme } from "./use-club-theme";
import {
  EVENTS,
  HIGHLIGHTS,
  MEMBER,
  MOST_FREQUENT,
  POINTS,
  PURCHASES,
  REWARDS,
  type ClubEvent,
  type Purchase,
} from "./data";

const EASE = [0.22, 1, 0.36, 1] as const;

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "recompensas", label: "Recompensas" },
  { id: "actividad", label: "Actividad" },
  { id: "eventos", label: "Eventos" },
  { id: "ajustes", label: "Ajustes" },
] as const;

const CHANNEL_ICON: Record<Purchase["channel"], typeof Store> = {
  Mesa: UtensilsCrossed,
  "Para llevar": ShoppingBag,
  Delivery: Truck,
  Panadería: Croissant,
};

const EVENT_ICON: Record<ClubEvent["kind"], typeof Store> = {
  descuento: Ticket,
  evento: Sparkles,
  cumple: CalendarHeart,
};

const HIGHLIGHT_ICON = [Store, Flame, Wallet] as const;

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Subtle rise-in used for section reveals. Content is fully opaque by default
 * (never gated behind the transition), so it always renders — even in headless
 * or reduced-motion contexts — and just eases up a few pixels for real users.
 */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { y: 14 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mc-eyebrow mb-2">{eyebrow}</p>
        <h2 className="text-[clamp(1.9rem,3.4vw,2.75rem)] font-semibold uppercase leading-[0.95] tracking-[-0.015em] text-cream text-balance">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function MiClubNav({
  theme,
  onToggleTheme,
  active,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  active: string;
}) {
  const reduce = useReducedMotion();
  return (
    <header className="mc-nav sticky top-0 z-40 border-b border-hair-div">
      <nav className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="La Bodega, inicio">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1a120b]">
            <Image src="/logo-bodega.png" alt="" width={28} height={28} className="size-7 object-contain" />
          </span>
          <span className="hidden flex-col leading-none min-[430px]:flex">
            <span className="text-lg font-bold uppercase tracking-[0.06em] text-cream">Bodega Club</span>
            <span className="text-[0.625rem] font-medium uppercase tracking-[0.18em] text-label">
              Área de socios
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => scrollToId(tab.id)}
              className={`mc-tab${active === tab.id ? " is-active" : ""}`}
              aria-current={active === tab.id ? "true" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
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
          <button
            type="button"
            onClick={() => scrollToId("ajustes")}
            className="flex items-center gap-2 rounded-full border border-hair-div py-1 pl-1 pr-3 transition-colors hover:border-coral"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
              AS
            </span>
            <span className="hidden text-sm font-semibold text-cream sm:block">{MEMBER.firstName}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

function ResumenSection({ onToast }: { onToast: (message: string) => void }) {
  // Next reward the member cannot fully afford yet — the goal that creates tension.
  const nextReward = useMemo(
    () => REWARDS.find((r) => r.points > POINTS.balance) ?? REWARDS[REWARDS.length - 1],
    [],
  );
  const remaining = Math.max(0, nextReward.points - POINTS.balance);
  const pct = Math.min(100, Math.round((POINTS.balance / nextReward.points) * 100));

  return (
    <section id="resumen" className="scroll-mt-24 pt-8 sm:pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <Reveal>
          <p className="mc-eyebrow mb-2">Tu resumen</p>
          <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">
            Hola, {MEMBER.firstName}.
          </h1>
          <p className="mt-3 max-w-[42ch] text-lg leading-relaxed text-body">
            Miembro {MEMBER.tier.toLowerCase()} desde {MEMBER.memberSince}. Esto es lo que llevas acumulado.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <Reveal className="flex items-center justify-center">
            <MembershipCard />
          </Reveal>

          <Reveal delay={0.08} className="flex">
            <div className="mc-panel-strong flex w-full flex-col gap-6 p-5 sm:p-7">
              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-label">
                      Próxima recompensa
                    </p>
                    <p className="mt-1 text-2xl font-semibold uppercase leading-tight text-cream">
                      {nextReward.name}
                    </p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="font-serif text-2xl leading-none text-gold-accent tabular-nums">
                      {remaining}
                    </span>
                    <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-label">
                      pts para llegar
                    </span>
                  </p>
                </div>
                <div className="mc-track mt-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progreso hacia ${nextReward.name}`}>
                  <motion.span
                    className="pop-fill block"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-ink tabular-nums">
                  {POINTS.balance} de {nextReward.points} pts · {pct}%
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {HIGHLIGHTS.map((stat, index) => {
                  const Icon = HIGHLIGHT_ICON[index];
                  return (
                    <div key={stat.label} className="mc-stat">
                      <Icon className="size-4 text-coral" strokeWidth={1.8} aria-hidden="true" />
                      <p className="mc-stat-value mt-2">{stat.value}</p>
                      <p className="mt-1.5 text-[0.8rem] font-semibold uppercase leading-tight tracking-[0.06em] text-label">
                        {stat.label}
                      </p>
                      <p className="text-xs text-muted-ink">{stat.hint}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => scrollToId("recompensas")}
                  className="btn3d btn3d--coral flex-1 text-[15px]"
                >
                  Canjear puntos
                  <ArrowUpRight aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    scrollToId("resumen");
                    onToast("Muestra el QR de tu tarjeta en caja para sumar o canjear.");
                  }}
                  className="btn3d btn3d--soft flex-1 text-[15px]"
                >
                  <QrCode aria-hidden="true" />
                  Mostrar mi QR
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mt-6">
          <div className="mc-panel p-5 sm:p-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="mc-eyebrow mb-1">Movimientos</p>
                <h2 className="text-lg font-semibold uppercase tracking-[0.01em] text-cream">
                  Últimas compras
                </h2>
              </div>
              <button
                type="button"
                onClick={() => scrollToId("actividad")}
                className="inline-flex items-center gap-1 text-sm font-semibold text-coral hover:underline"
              >
                Ver todo
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
            <ul className="divide-y divide-hair-div">
              {PURCHASES.slice(0, 5).map((purchase) => {
                const Icon = CHANNEL_ICON[purchase.channel];
                return (
                  <li
                    key={`mini-${purchase.date}-${purchase.summary}`}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-hair-chip text-coral">
                      <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-cream">{purchase.summary}</p>
                      <p className="text-xs text-muted-ink">
                        {purchase.dateLabel} · {purchase.branch}
                      </p>
                    </div>
                    <span className="font-serif text-lg leading-none text-gold-accent tabular-nums">
                      +{purchase.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PointsAndFavorite({ theme }: { theme: Theme }) {
  return (
    <section className="pt-12 sm:pt-16">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Reveal className="flex">
          <div className="mc-panel flex w-full flex-col p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="mc-eyebrow mb-1.5">Tus puntos</p>
                <h3 className="text-xl font-semibold uppercase tracking-[0.01em] text-cream">
                  Cómo has sumado
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hair-chip px-3 py-1.5 text-sm font-semibold text-gold-accent">
                <TrendingUp className="size-4" aria-hidden="true" />
                {POINTS.lifetime.toLocaleString("es-VE")} pts en total
              </span>
            </div>
            <PointsChart theme={theme} />
          </div>
        </Reveal>

        <Reveal delay={0.08} className="flex">
          <div className="mc-panel flex w-full flex-col overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden">
              <Photo
                id={MOST_FREQUENT.image}
                alt="Café de la casa, tu pedido más habitual"
                w={640}
                h={400}
                sizes="(max-width: 1023px) 100vw, 32vw"
              />
              <div className="mc-reward-scrim absolute inset-0" aria-hidden="true" />
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[rgba(25,13,7,0.82)] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#ffe6b0] backdrop-blur">
                <Repeat className="size-3.5" aria-hidden="true" />
                Tu clásico
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-2xl font-semibold uppercase leading-tight text-cream">
                {MOST_FREQUENT.name}
              </h3>
              <p className="mt-1 text-base text-body">{MOST_FREQUENT.detail}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-label">Pedido</dt>
                  <dd className="font-serif text-2xl text-gold-accent tabular-nums">
                    {MOST_FREQUENT.timesInWindow}
                    <span className="ml-1 font-sans text-xs font-semibold uppercase tracking-[0.08em] text-label">
                      veces
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-label">De tus pedidos</dt>
                  <dd className="font-serif text-2xl text-gold-accent tabular-nums">
                    {MOST_FREQUENT.share}
                    <span className="ml-0.5 font-sans text-xs font-semibold text-label">%</span>
                  </dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-hair-div pt-3 text-sm text-muted-ink">
                {MOST_FREQUENT.lastLabel}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function RewardsSection({ onToast }: { onToast: (message: string) => void }) {
  return (
    <section id="recompensas" className="scroll-mt-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading
          eyebrow="Para ti"
          title="Recompensas para canjear"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hair-chip px-3 py-1.5 text-sm font-semibold text-gold-accent">
              <Wallet className="size-4" aria-hidden="true" />
              Tienes {POINTS.balance} pts
            </span>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REWARDS.map((reward, index) => {
            const affordable = POINTS.balance >= reward.points;
            const missing = reward.points - POINTS.balance;
            return (
              <Reveal key={reward.name} delay={Math.min(index * 0.05, 0.25)} className="flex">
                <article className="mc-reward w-full" data-locked={!affordable}>
                  <div className="mc-reward-media">
                    <Photo
                      id={reward.image}
                      alt={reward.name}
                      w={520}
                      h={325}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                    <div className="mc-reward-scrim absolute inset-0" aria-hidden="true" />
                    <span className="absolute left-3 top-3 rounded-full bg-[rgba(25,13,7,0.7)] px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#f4e2c4] backdrop-blur">
                      {reward.category}
                    </span>
                    <span className="absolute bottom-3 right-3">
                      {affordable ? (
                        <span className="mc-reward-cost">
                          <reward.Icon className="size-3.5" aria-hidden="true" />
                          {reward.points} pts
                        </span>
                      ) : (
                        <span className="mc-reward-lock">
                          Faltan {missing} pts
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-xl font-semibold uppercase leading-tight text-cream">
                      {reward.name}
                    </h3>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-body">{reward.note}</p>
                    <button
                      type="button"
                      disabled={!affordable}
                      onClick={() =>
                        onToast(`Pediste ${reward.name}. Muestra tu QR en caja para completar el canje.`)
                      }
                      className={`btn3d mt-4 w-full text-[15px] ${affordable ? "btn3d--gold" : "btn3d--soft"}`}
                    >
                      {affordable ? (
                        <>
                          Canjear ahora
                          <Check aria-hidden="true" />
                        </>
                      ) : (
                        "Sigue sumando"
                      )}
                    </button>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ActivitySection() {
  const spent = PURCHASES.reduce((sum, p) => sum + p.amount, 0);
  const earned = PURCHASES.reduce((sum, p) => sum + p.points, 0);

  return (
    <section id="actividad" className="scroll-mt-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading eyebrow="Tus compras" title="Actividad reciente" />
        <div className="grid gap-6 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
          <Reveal className="flex">
            <div className="mc-panel-strong grid w-full gap-4 p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.1em] text-label">
                  Gastado (6 compras)
                </p>
                <p className="font-serif text-4xl text-cream tabular-nums">
                  ${spent.toFixed(2)}
                </p>
              </div>
              <div className="border-t border-hair-div pt-4">
                <p className="text-sm font-semibold uppercase tracking-[0.1em] text-label">
                  Puntos sumados
                </p>
                <p className="font-serif text-4xl text-gold-accent tabular-nums">+{earned}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-ink">
                Un punto por cada dólar consumido, en mesa, panadería, para llevar y delivery.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="flex">
            <div className="mc-panel w-full p-2 sm:p-4">
              <ul>
                {PURCHASES.map((purchase) => {
                  const Icon = CHANNEL_ICON[purchase.channel];
                  return (
                    <li key={`${purchase.date}-${purchase.summary}`} className="mc-activity-row px-2 sm:px-3">
                      <span className="flex size-11 items-center justify-center rounded-full border border-hair-chip text-coral">
                        <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-cream">{purchase.summary}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-ink">
                          <span>{purchase.dateLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{purchase.branch}</span>
                          <span className="mc-channel">{purchase.channel}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="mc-points-gain">+{purchase.points}</p>
                        <p className="text-sm text-muted-ink tabular-nums">${purchase.amount.toFixed(2)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function EventsSection() {
  return (
    <section id="eventos" className="scroll-mt-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading eyebrow="Agenda" title="Eventos y descuentos oficiales" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EVENTS.map((event, index) => {
            const Icon = EVENT_ICON[event.kind];
            return (
              <Reveal key={event.title} delay={Math.min(index * 0.05, 0.2)} className="flex">
                <article className="mc-event w-full" data-kind={event.kind}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="mc-event-tag">
                      <Icon className="size-3.5" aria-hidden="true" />
                      {event.tag}
                    </span>
                    {event.official ? (
                      <span className="mc-official">
                        <Check className="size-3.5" aria-hidden="true" />
                        Oficial
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold uppercase leading-tight text-cream">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-coral">{event.when}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{event.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-on={checked}
      onClick={() => onChange(!checked)}
      className="mc-switch"
    />
  );
}

function SettingsSection() {
  const router = useRouter();
  const [notifs, setNotifs] = useState({ whatsapp: true, email: false, offers: true });

  return (
    <section id="ajustes" className="scroll-mt-24 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading eyebrow="Tu cuenta" title="Configuración" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="flex">
            <div className="mc-panel w-full p-5 sm:p-7">
              <h3 className="text-lg font-semibold uppercase tracking-[0.02em] text-cream">
                Datos de la cuenta
              </h3>
              <div className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-cream">Nombre</span>
                    <input className="mc-field" defaultValue={MEMBER.fullName} autoComplete="name" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-cream">Nombre de usuario</span>
                    <div className="relative">
                      <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
                      <input
                        className="mc-field pl-10"
                        defaultValue={MEMBER.username}
                        autoComplete="username"
                        placeholder="tu.usuario"
                      />
                    </div>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-cream">WhatsApp</span>
                    <input className="mc-field" defaultValue={MEMBER.whatsapp} inputMode="tel" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-cream">Correo</span>
                    <input className="mc-field" defaultValue={MEMBER.email} inputMode="email" />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-ink">
                  <span className="inline-flex items-center gap-2">
                    <IdCard className="size-4 text-coral" aria-hidden="true" />
                    Cédula: <span className="font-semibold text-body">{MEMBER.cedula}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4 text-coral" aria-hidden="true" />
                    Sucursal favorita: <span className="font-semibold text-body">{MEMBER.homeBranch}</span>
                  </span>
                </div>
              </div>
              <button type="button" className="btn3d btn3d--soft mt-6 text-[15px]">
                Guardar cambios
                <Check aria-hidden="true" />
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="flex">
            <div className="mc-panel flex w-full flex-col p-5 sm:p-7">
              <h3 className="text-lg font-semibold uppercase tracking-[0.02em] text-cream">
                Notificaciones
              </h3>
              <ul className="mt-4 divide-y divide-hair-div">
                {[
                  { key: "whatsapp" as const, Icon: MessageCircle, title: "Avisos por WhatsApp", desc: "Puntos, canjes y recordatorios." },
                  { key: "offers" as const, Icon: Bell, title: "Ofertas y puntos dobles", desc: "Te avisamos antes de cada campaña." },
                  { key: "email" as const, Icon: Mail, title: "Resumen por correo", desc: "Tu estado de cuenta cada mes." },
                ].map(({ key, Icon, title, desc }) => (
                  <li key={key} className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-5 text-coral" strokeWidth={1.8} aria-hidden="true" />
                      <div>
                        <p className="font-semibold text-cream">{title}</p>
                        <p className="text-sm text-muted-ink">{desc}</p>
                      </div>
                    </div>
                    <Toggle
                      checked={notifs[key]}
                      onChange={(next) => setNotifs((c) => ({ ...c, [key]: next }))}
                      label={title}
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-3 border-t border-hair-div pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-ink">
                  Sesión iniciada como <span className="font-semibold text-body">@{MEMBER.username}</span>
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="btn3d btn3d--soft text-[15px]"
                >
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function MiClubFooter() {
  return (
    <footer className="border-t border-hair-div px-5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-body">
          <Link href="/bodega-club" className="inline-flex items-center gap-1 hover:text-cream">
            Sobre el club <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
          <Link href="/feedback" className="hover:text-cream">Cuéntanos tu experiencia</Link>
          <Link href="/" className="hover:text-cream">Volver al inicio</Link>
        </div>
        <p className="text-sm text-label">© 2026 La Bodega · Demostración de producto</p>
      </div>
    </footer>
  );
}

/** Very small toast used to acknowledge redeem/QR actions in the mockup. */
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      <AnimatePresence onExitComplete={onDismiss}>
        {message ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            role="status"
            style={{ background: "color-mix(in oklab, var(--lb-ground) 92%, transparent)" }}
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border border-hair-card px-4 py-3 text-sm text-body shadow-[0_20px_50px_-20px_rgba(20,9,3,0.8)] backdrop-blur"
          >
            <Gift className="mt-0.5 size-5 shrink-0 text-gold-accent" aria-hidden="true" />
            <span>{message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function MiClubPage() {
  const { theme, toggleTheme } = useClubTheme();
  const [toast, setToast] = useState("");

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  }

  return (
    <div className={`${theme === "day" ? "day " : ""}mc-page relative min-h-dvh overflow-x-hidden`}>
      <div className="mc-page-background" aria-hidden="true" />
      <div className="relative z-[1]">
        <MiClubNav theme={theme} onToggleTheme={toggleTheme} active="resumen" />
        <main>
          <ResumenSection onToast={showToast} />
          <PointsAndFavorite theme={theme} />
          <RewardsSection onToast={showToast} />
          <ActivitySection />
          <EventsSection />
          <SettingsSection />
        </main>
        <MiClubFooter />
      </div>
      <Toast message={toast} onDismiss={() => undefined} />
    </div>
  );
}
