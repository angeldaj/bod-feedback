"use client";

import { createElement, useMemo, useState, type CSSProperties } from "react";
import { ChevronDown, Gift, MapPin, MessageCircleHeart, ReceiptText, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bar, BarChart, LabelList, Rectangle, XAxis, type BarShapeProps } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ActivityItem, ClubActivity } from "@/lib/club-api";
import { useClub } from "../club-provider";
import { categoryIcon, fmtPts, isToday, monthLabel, shortDate } from "../club-visuals";
import { Skeleton } from "../pieces";

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "purchase", label: "Compras" },
  { id: "redemption", label: "Canjes" },
  { id: "grant", label: "Regalos" },
  { id: "social", label: "Instagram" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

const CHANNEL_ICON = { Mesa: "Almuerzo", "Para llevar": "Panadería", Delivery: "Delivery", Panadería: "Panadería" } as const;
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const chartConfig = { earned: { label: "Puntos" } } satisfies ChartConfig;

function PointsChart({ monthly }: { monthly: ClubActivity["monthly"] }) {
  const reduce = useReducedMotion();
  const data = monthly.map((m, i) => ({
    label: MONTHS[Number(m.month.slice(5, 7)) - 1] ?? m.month,
    earned: m.earned,
    current: i === monthly.length - 1,
  }));
  const summary = data.map((d) => `${d.label} ${d.earned}`).join(", ");
  return (
    <div role="img" aria-label={`Puntos por mes: ${summary}`}>
      <ChartContainer config={chartConfig} className="chart-box !aspect-auto">
        <BarChart data={data} margin={{ top: 24, right: 6, left: 6, bottom: 0 }} accessibilityLayer={false}>
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--div-strong)" }} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel className="mc2-tooltip" formatter={(value) => <span>{Number(value)} pts</span>} />} />
          <Bar
            dataKey="earned"
            radius={8}
            maxBarSize={34}
            isAnimationActive={!reduce}
            animationDuration={700}
            shape={(props: BarShapeProps) => (
              <Rectangle {...props} fill={(props.payload as { current?: boolean })?.current ? "var(--gold)" : "var(--track)"} />
            )}
          >
            <LabelList dataKey="earned" position="top" offset={8} className="mc2-bar-label" />
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function when(iso: string) {
  return isToday(iso) ? "Hoy" : shortDate(iso);
}

/** Puntos como marca principal de cada fila: ganados en dorado, canjeados en coral, regalos van a la Wallet. */
function RowPoints({ item }: { item: ActivityItem }) {
  if (item.type === "grant") {
    return (
      <span className="ar-pts gift">
        <Gift aria-hidden="true" />
        <small>A tu Wallet</small>
      </span>
    );
  }
  const neg = item.type === "redemption";
  return (
    <span className={`ar-pts${neg ? " neg" : item.points ? "" : " zero"}`}>
      <strong>
        {neg ? "" : "+"}
        {fmtPts(item.points)}
      </strong>
      <small>pts</small>
    </span>
  );
}

function RowIcon({ item }: { item: ActivityItem }) {
  const Icon =
    item.type === "purchase"
      ? categoryIcon(CHANNEL_ICON[item.channel])
      : item.type === "social"
        ? MessageCircleHeart
        : item.type === "grant" && !item.category
          ? Sparkles
          : categoryIcon(item.category);
  return <span className={`ar-ic ${item.type}`}>{createElement(Icon, { "aria-hidden": true })}</span>;
}

function PurchaseRow({ item, open, onToggle }: { item: Extract<ActivityItem, { type: "purchase" }>; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const panel = `it-${item.id}`;
  return (
    <>
      <button type="button" className="ar ar-btn" aria-expanded={open} aria-controls={panel} onClick={onToggle}>
        <RowIcon item={item} />
        <span className="ar-txt">
          <b>{item.title}</b>
          <small>
            {when(item.occurredAt)} · {item.branch} · {item.channel} · {item.payment}
          </small>
        </span>
        <RowPoints item={item} />
        <ChevronDown className="ar-chev" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panel}
            className="ar-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: reduce ? 0 : 0.26, ease: EASE_OUT },
              opacity: { duration: 0.18 },
            }}
          >
            <ul className="ar-items" aria-label="Lo que pediste">
              {item.lines.map((l, i) => (
                <motion.li
                  key={l.name}
                  initial={
                    reduce
                      ? false
                      : {
                          opacity: 0,
                          transform: "translateY(-4px)",
                          filter: "blur(2px)",
                        }
                  }
                  animate={{
                    opacity: 1,
                    transform: "translateY(0px)",
                    filter: "blur(0px)",
                  }}
                  transition={{
                    duration: 0.22,
                    delay: 0.04 + i * 0.03,
                    ease: EASE_OUT,
                  }}
                >
                  <span>{l.name}</span>
                  {l.qty > 1 ? <span className="ar-qty">×{l.qty}</span> : null}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function EventRow({ item }: { item: Extract<ActivityItem, { type: "redemption" | "grant" | "social" }> }) {
  return (
    <div className="ar">
      <RowIcon item={item} />
      <span className="ar-txt">
        <b>{item.title}</b>
        <small>
          {when(item.occurredAt)} · {item.detail}
        </small>
      </span>
      <RowPoints item={item} />
      <span className="ar-chev" aria-hidden="true" />
    </div>
  );
}

export function ActividadScreen() {
  const { activity, loading } = useClub();
  const [filter, setFilter] = useState<FilterId>("all");
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const groups = useMemo(() => {
    const items = (activity?.items ?? []).filter((a) => filter === "all" || a.type === filter);
    const out: { key: string; label: string; points: number; items: ActivityItem[] }[] = [];
    for (const item of items) {
      const d = new Date(item.occurredAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let g = out.find((x) => x.key === key);
      if (!g) out.push((g = { key, label: monthLabel(item.occurredAt), points: 0, items: [] }));
      g.items.push(item);
      if (item.type === "purchase" || item.type === "social") g.points += item.points;
    }
    return out;
  }, [activity, filter]);

  const toggle = (id: string) =>
    setOpenIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const month = activity?.thisMonth;
  const monthName = new Date().toLocaleDateString("es-VE", { month: "long" });

  return (
    <div className="view">
      <div className="v-head">
        <h1>Actividad</h1>
        <p>Lo que pediste, lo que sumaste y lo que canjeaste.</p>
      </div>

      <div className="act-body">
        {loading || !activity || !month ? (
          <div className="act-top">
            <Skeleton height={170} />
            <Skeleton height={220} />
          </div>
        ) : (
          <div className="act-top">
            <section className="tile act-sum" aria-labelledby="act-month">
              <h2 id="act-month" style={{ textTransform: "uppercase" }}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </h2>
              <div className="sum-grid">
                <div>
                  <strong className="gold">+{fmtPts(month.points)}</strong>
                  <small>Puntos</small>
                </div>
                <div>
                  <strong>{month.visits}</strong>
                  <small>Visitas</small>
                </div>
              </div>
              {month.favoriteBranch ? (
                <p className="sum-note">
                  <MapPin aria-hidden="true" />
                  Tu sede favorita: {month.favoriteBranch.replace(/^Sede /, "")}
                </p>
              ) : null}
            </section>
            <section className="tile act-chart" aria-labelledby="act-chart">
              <div className="sec-head">
                <h2 id="act-chart">Puntos por mes</h2>
                <span className="muted-sm">Últimos {activity.monthly.length} meses</span>
              </div>
              <PointsChart monthly={activity.monthly} />
            </section>
          </div>
        )}

        <div className="act-feed">
          <div className="fchips" role="group" aria-label="Filtrar actividad">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className="fchip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="act-months">
              <Skeleton height={320} />
            </div>
          ) : groups.length ? (
            <div className="act-months" key={filter}>
              {groups.map((g, gi) => (
                <section key={g.key} className="act-month" aria-label={g.label}>
                  <h3>
                    <span>{g.label}</span>
                    {g.points ? <span className="am-pts">+{fmtPts(g.points)} pts</span> : null}
                  </h3>
                  <ul className="list act-list">
                    {g.items.map((item, i) => (
                      <li key={item.id} style={{ "--i": Math.min(gi * 4 + i, 12) } as CSSProperties}>
                        {item.type === "purchase" ? (
                          <PurchaseRow item={item} open={openIds.has(item.id)} onToggle={() => toggle(item.id)} />
                        ) : (
                          <EventRow item={item} />
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="empty">
              <ReceiptText aria-hidden="true" />
              <b>Nada por aquí todavía</b>
              <span>Cuando compres o uses tu Wallet, lo verás en esta lista.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
