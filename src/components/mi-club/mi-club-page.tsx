"use client";

import { useEffect, useMemo, useState } from "react";
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
  CircleAlert,
  Croissant,
  Gift,
  IdCard,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  QrCode,
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
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Photo } from "@/components/landing/photo";
import { useMember } from "@/lib/member-session";
import { updateNotificationPreferences } from "@/lib/loyalty-api";
import type { Member, MemberNotification, Redemption } from "@/lib/loyalty-api";
import { MembershipCard } from "./membership-card";
import { PointsChart } from "./points-chart";
import { useClubTheme, type Theme } from "./use-club-theme";
import { useMemberData } from "./use-member-data";
import {
  DEFAULT_REWARD_ICON,
  REWARD_CATEGORY_ICON,
  resolveRewardImage,
  type ClubEvent,
  type PointsPoint,
  type Purchase,
  type Reward,
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

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-VE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
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
  member,
  theme,
  onToggleTheme,
  active,
}: {
  member: Member;
  theme: Theme;
  onToggleTheme: () => void;
  active: string;
}) {
  const reduce = useReducedMotion();
  const initials = member.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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
              {initials || "?"}
            </span>
            <span className="hidden text-sm font-semibold text-cream sm:block">{member.firstName}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

function ResumenSection({
  member,
  rewards,
  purchases,
  visitsThisMonth,
  qrValue,
  onToast,
}: {
  member: Member;
  rewards: Reward[];
  purchases: Purchase[];
  visitsThisMonth: number;
  qrValue: string;
  onToast: (message: string) => void;
}) {
  const balance = member.points.balance;
  // Next reward the member cannot fully afford yet — the goal that creates tension.
  const nextReward = useMemo(() => {
    if (!rewards.length) return null;
    return rewards.find((r) => r.points > balance) ?? rewards[rewards.length - 1];
  }, [rewards, balance]);
  const remaining = nextReward ? Math.max(0, nextReward.points - balance) : 0;
  const pct = nextReward ? Math.min(100, Math.round((balance / nextReward.points) * 100)) : 0;

  return (
    <section id="resumen" className="scroll-mt-24 pt-8 sm:pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <Reveal>
          <p className="mc-eyebrow mb-2">Tu resumen</p>
          <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-semibold uppercase leading-[0.9] tracking-[-0.02em] text-cream text-balance">
            Hola, {member.firstName}.
          </h1>
          <p className="mt-3 max-w-[42ch] text-lg leading-relaxed text-body">
            {member.tier ? (
              <>Miembro {member.tier.name.toLowerCase()}{member.memberSince ? ` desde ${member.memberSince}` : ""}. Esto es lo que llevas acumulado.</>
            ) : (
              "Esto es lo que llevas acumulado."
            )}
          </p>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
          <Reveal className="flex items-center justify-center">
            <MembershipCard member={member} qrValue={qrValue || member.memberNo} />
          </Reveal>

          <Reveal delay={0.08} className="flex">
            <div className="mc-panel-strong flex w-full flex-col gap-6 p-5 sm:p-7">
              {nextReward ? (
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
                    {balance} de {nextReward.points} pts · {pct}%
                  </p>
                </div>
              ) : (
                <p className="text-base text-body">Estamos cargando el catálogo de recompensas.</p>
              )}

              <div className="grid max-w-[12rem] grid-cols-1 gap-3">
                <div className="mc-stat">
                  <Store className="size-4 text-coral" strokeWidth={1.8} aria-hidden="true" />
                  <p className="mc-stat-value mt-2">{visitsThisMonth}</p>
                  <p className="mt-1.5 text-[0.8rem] font-semibold uppercase leading-tight tracking-[0.06em] text-label">
                    Visitas este mes
                  </p>
                  <p className="text-xs text-muted-ink">{purchases.length} en tu historial</p>
                </div>
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
            {purchases.length ? (
              <ul className="divide-y divide-hair-div">
                {purchases.slice(0, 5).map((purchase) => {
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
                          {purchase.paymentMethods.length ? ` · ${purchase.paymentMethods.join(", ")}` : ""}
                        </p>
                      </div>
                      <span className="font-serif text-lg leading-none text-gold-accent tabular-nums">
                        +{purchase.points}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-3 text-sm text-muted-ink">Todavía no registramos compras en tu cuenta.</p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PointsPanel({ theme, series, lifetime }: { theme: Theme; series: PointsPoint[]; lifetime: number }) {
  return (
    <section className="pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
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
                {lifetime.toLocaleString("es-VE")} pts en total
              </span>
            </div>
            <PointsChart theme={theme} series={series} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function RewardsSection({
  balance,
  rewards,
  loading,
  redeemingId,
  onRedeem,
}: {
  balance: number;
  rewards: Reward[];
  loading: boolean;
  redeemingId: string | null;
  onRedeem: (reward: Reward) => void;
}) {
  return (
    <section id="recompensas" className="scroll-mt-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading
          eyebrow="Para ti"
          title="Recompensas para canjear"
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-hair-chip px-3 py-1.5 text-sm font-semibold text-gold-accent">
              <Wallet className="size-4" aria-hidden="true" />
              Tienes {balance} pts
            </span>
          }
        />
        {!rewards.length && !loading ? (
          <p className="text-base text-body">Todavía no hay recompensas activas para mostrar.</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward, index) => {
            const Icon = REWARD_CATEGORY_ICON[reward.category] ?? DEFAULT_REWARD_ICON;
            const missing = reward.points - balance;
            const isRedeeming = redeemingId === reward.id;
            return (
              <Reveal key={reward.id} delay={Math.min(index * 0.05, 0.25)} className="flex">
                <article className="mc-reward w-full" data-locked={!reward.affordable}>
                  <div className="mc-reward-media">
                    <Photo
                      id={resolveRewardImage(reward)}
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
                      {reward.affordable ? (
                        <span className="mc-reward-cost">
                          <Icon className="size-3.5" aria-hidden="true" />
                          {reward.points} pts
                        </span>
                      ) : (
                        <span className="mc-reward-lock">
                          Faltan {Math.max(0, missing)} pts
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
                      disabled={!reward.affordable || isRedeeming}
                      onClick={() => onRedeem(reward)}
                      className={`btn3d mt-4 w-full text-[15px] ${reward.affordable ? "btn3d--gold" : "btn3d--soft"}`}
                    >
                      {isRedeeming ? (
                        <>
                          <LoaderCircle className="animate-spin" aria-hidden="true" />
                          Pidiendo canje
                        </>
                      ) : reward.affordable ? (
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

function ActivitySection({ purchases }: { purchases: Purchase[] }) {
  const spent = purchases.reduce((sum, p) => sum + p.amount, 0);
  const earned = purchases.reduce((sum, p) => sum + p.points, 0);

  return (
    <section id="actividad" className="scroll-mt-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading eyebrow="Tus compras" title="Actividad reciente" />
        <div className="grid gap-6 lg:grid-cols-[0.62fr_1.38fr] lg:items-start">
          <Reveal className="flex">
            <div className="mc-panel-strong grid w-full gap-4 p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.1em] text-label">
                  Gastado ({purchases.length} {purchases.length === 1 ? "compra" : "compras"})
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
              {purchases.length ? (
                <ul>
                  {purchases.map((purchase) => {
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
                            {purchase.paymentMethods.map((method) => (
                              <span key={method} className={method === "Crédito" ? "mc-channel text-coral" : "mc-channel"}>
                                {method}
                              </span>
                            ))}
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
              ) : (
                <p className="p-4 text-sm text-muted-ink">Todavía no registramos compras en tu cuenta.</p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function EventsSection({ events }: { events: ClubEvent[] }) {
  return (
    <section id="eventos" className="scroll-mt-24 pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-5">
        <SectionHeading eyebrow="Agenda" title="Eventos y descuentos oficiales" />
        {events.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((event, index) => {
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
        ) : (
          <p className="text-base text-body">No hay eventos activos por ahora. Vuelve pronto.</p>
        )}
      </div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-on={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="mc-switch"
    />
  );
}

function NotificationsInbox({
  notifications,
  onMarkRead,
}: {
  notifications: MemberNotification[];
  onMarkRead: (id: string) => void;
}) {
  if (!notifications.length) {
    return <p className="text-sm text-muted-ink">Todavía no tienes avisos. Aquí aparecerán tus puntos, canjes y novedades.</p>;
  }
  return (
    <ul className="grid gap-2" aria-live="polite">
      {notifications.slice(0, 6).map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => !n.readAt && onMarkRead(n.id)}
            className="w-full rounded-xl border border-hair-div p-3 text-left transition-colors hover:border-coral disabled:cursor-default"
            disabled={Boolean(n.readAt)}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-cream">{n.title}</p>
              {!n.readAt ? (
                <span className="mt-1 size-2 shrink-0 rounded-full bg-coral" aria-hidden="true" />
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-muted-ink">{n.body}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function SettingsSection({
  member,
  notifications,
  onMarkRead,
  onSaveProfile,
  onToggleNotification,
  onLogout,
}: {
  member: Member;
  notifications: MemberNotification[];
  onMarkRead: (id: string) => void;
  onSaveProfile: (patch: { name: string; username: string; whatsapp: string; email: string }) => Promise<void>;
  onToggleNotification: (key: "whatsapp" | "email" | "offers", next: boolean) => void;
  onLogout: () => void;
}) {
  const [name, setName] = useState(member.fullName);
  const [username, setUsername] = useState(member.username ?? "");
  const [whatsapp, setWhatsapp] = useState(member.whatsapp);
  const [email, setEmail] = useState(member.email);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  async function handleSave() {
    setSaveStatus("saving");
    setSaveError("");
    try {
      await onSaveProfile({ name: name.trim(), username: username.trim(), whatsapp: whatsapp.trim(), email: email.trim() });
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus("idle"), 2400);
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    }
  }

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
                    <input
                      className="mc-field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-cream">Nombre de usuario</span>
                    <div className="relative">
                      <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden="true" />
                      <input
                        className="mc-field pl-10"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="tu.usuario"
                      />
                    </div>
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-cream">WhatsApp</span>
                    <input className="mc-field" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-sm font-semibold text-cream">Correo</span>
                    <input className="mc-field" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" type="email" />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-ink">
                  <span className="inline-flex items-center gap-2">
                    <IdCard className="size-4 text-coral" aria-hidden="true" />
                    Cédula: <span className="font-semibold text-body">{member.cedula}</span>
                  </span>
                  {member.homeBranchId ? (
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="size-4 text-coral" aria-hidden="true" />
                      Sucursal favorita registrada
                    </span>
                  ) : null}
                </div>
              </div>
              {saveStatus === "error" ? (
                <div className="club-submit-error mt-4 flex items-start gap-2 rounded-xl p-3 text-sm" role="alert">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{saveError}</span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className="btn3d btn3d--soft mt-6 text-[15px]"
              >
                {saveStatus === "saving" ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    Guardando
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    Guardado
                    <Check aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Guardar cambios
                    <Check aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="flex">
            <div className="mc-panel flex w-full flex-col p-5 sm:p-7">
              <h3 className="text-lg font-semibold uppercase tracking-[0.02em] text-cream">
                Buzón
              </h3>
              <div className="mt-4">
                <NotificationsInbox notifications={notifications} onMarkRead={onMarkRead} />
              </div>

              <h3 className="mt-7 text-lg font-semibold uppercase tracking-[0.02em] text-cream">
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
                      checked={member.notificationPreferences[key]}
                      onChange={(next) => onToggleNotification(key, next)}
                      label={title}
                    />
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-3 border-t border-hair-div pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-ink">
                  Sesión iniciada como{" "}
                  <span className="font-semibold text-body">
                    {member.username ? `@${member.username}` : member.cedula}
                  </span>
                </p>
                <button type="button" onClick={onLogout} className="btn3d btn3d--soft text-[15px]">
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
        <p className="text-sm text-label">© 2026 La Bodega</p>
      </div>
    </footer>
  );
}

/** Very small toast used to acknowledge redeem/QR actions. */
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

/** Muestra el código/QR del canje recién pedido, con su vencimiento (24 h). */
function RedemptionDialog({
  redemption,
  onClose,
}: {
  redemption: Redemption | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(redemption)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-[#090604]/70 backdrop-blur-sm"
        className="club-dialog gap-0 p-0 sm:max-w-[26rem]"
      >
        {redemption ? (
          <div className="flex flex-col items-center gap-6 p-6 text-center sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-coral">Canje pedido</p>
              <DialogTitle className="mt-2 text-[clamp(1.75rem,5vw,2.5rem)] font-semibold uppercase leading-[0.95] tracking-[-0.02em] text-cream text-balance">
                {redemption.rewardName || "Tu recompensa"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed text-body">
                Muestra este código o el QR en caja para completarlo. Vence el {formatExpiry(redemption.expiresAt)}.
              </DialogDescription>
            </div>
            <div className="rounded-2xl bg-[#f3d692] p-4">
              <QRCode value={redemption.code} size={160} bgColor="#f3d692" fgColor="#2a1608" level="M" />
            </div>
            <p className="font-serif text-3xl tracking-[0.14em] text-gold-accent tabular-nums">{redemption.code}</p>
            <button type="button" onClick={onClose} className="btn3d btn3d--coral w-full text-[15px]">
              Entendido
            </button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function MiClubLoading({ theme }: { theme: Theme }) {
  return (
    <div className={`${theme === "day" ? "day " : ""}mc-page relative flex min-h-dvh items-center justify-center overflow-x-hidden`}>
      <div className="mc-page-background" aria-hidden="true" />
      <div className="relative z-[1] flex flex-col items-center gap-3 text-body">
        <LoaderCircle className="size-6 animate-spin text-coral" aria-hidden="true" />
        <p className="text-sm">Cargando tu cuenta…</p>
      </div>
    </div>
  );
}

function MiClubDashboard({ member }: { member: Member }) {
  const router = useRouter();
  const { theme, toggleTheme } = useClubTheme();
  const { logout, updateProfile, authedRequest, refreshMember } = useMember();
  const data = useMemberData();
  const [toast, setToast] = useState("");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [activeRedemption, setActiveRedemption] = useState<Redemption | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3600);
  }

  async function handleRedeem(reward: Reward) {
    setRedeemingId(reward.id);
    try {
      const redemption = await data.redeem(reward.id);
      setActiveRedemption(redemption);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "No pudimos completar el canje. Intenta de nuevo.",
      );
    } finally {
      setRedeemingId(null);
    }
  }

  async function handleSaveProfile(patch: { name: string; username: string; whatsapp: string; email: string }) {
    await updateProfile({
      name: patch.name,
      username: patch.username || undefined,
      whatsapp: patch.whatsapp,
      email: patch.email,
    });
  }

  async function handleToggleNotification(key: "whatsapp" | "email" | "offers", next: boolean) {
    try {
      await authedRequest((token) => updateNotificationPreferences(token, { [key]: next }));
      await refreshMember();
    } catch {
      showToast("No pudimos actualizar esa preferencia. Intenta de nuevo.");
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className={`${theme === "day" ? "day " : ""}mc-page relative min-h-dvh overflow-x-hidden`}>
      <div className="mc-page-background" aria-hidden="true" />
      <div className="relative z-[1]">
        <MiClubNav member={member} theme={theme} onToggleTheme={toggleTheme} active="resumen" />
        <main>
          {data.error ? (
            <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-5">
              <div className="club-submit-error flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm" role="alert">
                <span className="flex items-center gap-2">
                  <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
                  {data.error}
                </span>
                <button type="button" onClick={() => data.reload()} className="font-semibold text-coral hover:underline">
                  Reintentar
                </button>
              </div>
            </div>
          ) : null}
          <ResumenSection
            member={member}
            rewards={data.rewards}
            purchases={data.purchases}
            visitsThisMonth={data.visitsThisMonth}
            qrValue={data.qrValue}
            onToast={showToast}
          />
          <PointsPanel theme={theme} series={data.pointsSeries} lifetime={member.points.lifetime} />
          <RewardsSection
            balance={member.points.balance}
            rewards={data.rewards}
            loading={data.loading}
            redeemingId={redeemingId}
            onRedeem={handleRedeem}
          />
          <ActivitySection purchases={data.purchases} />
          <EventsSection events={data.events} />
          <SettingsSection
            member={member}
            notifications={data.notifications}
            onMarkRead={data.markNotificationRead}
            onSaveProfile={handleSaveProfile}
            onToggleNotification={handleToggleNotification}
            onLogout={handleLogout}
          />
        </main>
        <MiClubFooter />
      </div>
      <Toast message={toast} onDismiss={() => undefined} />
      <RedemptionDialog redemption={activeRedemption} onClose={() => setActiveRedemption(null)} />
    </div>
  );
}

export function MiClubPage() {
  const router = useRouter();
  const { theme } = useClubTheme();
  const { member, loading } = useMember();

  useEffect(() => {
    if (!loading && !member) {
      router.replace(`/login?returnTo=${encodeURIComponent("/mi-club")}`);
    }
  }, [loading, member, router]);

  if (loading || !member) {
    return <MiClubLoading theme={theme} />;
  }

  return <MiClubDashboard member={member} />;
}
