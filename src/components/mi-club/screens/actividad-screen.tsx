"use client";

import { createElement, useMemo, useState } from "react";
import { ChevronDown, Gift, MapPin, ReceiptText, Sparkles } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, LabelList, Rectangle, XAxis, type BarShapeProps } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ActivityItem, ClubActivity } from "@/lib/club-api";
import { useClub } from "../club-provider";
import { categoryIcon, categoryTone, fmtPts, isToday, money, monthLabel, shortDate } from "../club-visuals";
import { ImageSlot, Skeleton } from "../pieces";

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "purchase", label: "Compras" },
  { id: "redemption", label: "Canjes" },
  { id: "grant", label: "Regalos" },
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

function PurchaseCard({ item, open, onToggle }: { item: Extract<ActivityItem, { type: "purchase" }>; open: boolean; onToggle: () => void }) {
  const cat = CHANNEL_ICON[item.channel];
  return (
    <article className="ac">
      <div className="ac-row">
        <span className="ac-thumb">
          <ImageSlot tone={categoryTone(cat)} icon={categoryIcon(cat)} />
        </span>
        <div className="ac-main">
          <b>{item.title}</b>
          <small>
            {isToday(item.occurredAt) ? "Hoy" : shortDate(item.occurredAt)}, {item.branch}
          </small>
          <div className="tags">
            <span className="tag">{item.channel}</span>
            <span className="tag">{item.payment}</span>
          </div>
        </div>
        <div className="ac-end">
          <strong>+{fmtPts(item.points)}</strong>
          <small>{money(item.amount)}</small>
        </div>
      </div>
      <button type="button" className="ac-toggle" aria-expanded={open} aria-controls={`it-${item.id}`} onClick={onToggle}>
        {open ? "Ocultar pedido" : `Ver lo que pediste (${item.lines.length})`}
        <ChevronDown aria-hidden="true" />
      </button>
      <div className="ac-items" id={`it-${item.id}`} hidden={!open}>
        {item.lines.map((l) => (
          <div key={l.name}>
            <span>
              {l.name}
              {l.qty > 1 ? ` x${l.qty}` : ""}
            </span>
            <span>{money(l.amount)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function EventCard({ item }: { item: Extract<ActivityItem, { type: "redemption" | "grant" }> }) {
  return (
    <article className={`ac evt ${item.type}`}>
      <div className="ac-row">
        <span className="ac-thumb">
          {createElement(item.type === "grant" && !item.category ? Sparkles : categoryIcon(item.category), { "aria-hidden": true })}
        </span>
        <div className="ac-main">
          <b>{item.title}</b>
          <small>
            {isToday(item.occurredAt) ? "Hoy" : shortDate(item.occurredAt)}, {item.detail}
          </small>
          <div className="tags">
            <span className="tag">{item.type === "redemption" ? "Canje con puntos" : "Regalo de la casa"}</span>
          </div>
        </div>
        <div className="ac-end">
          {item.type === "redemption" ? (
            <>
              <strong className="neg">{fmtPts(item.points)}</strong>
              <small>pts</small>
            </>
          ) : (
            <>
              <strong>
                <Gift aria-hidden="true" />
              </strong>
              <small>En tu Wallet</small>
            </>
          )}
        </div>
      </div>
    </article>
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
      if (item.type === "purchase") g.points += item.points;
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
                <strong>{money(month.spent)}</strong>
                <small>Consumido</small>
              </div>
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

      <div className="fchips" role="group" aria-label="Filtrar actividad">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className="fchip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="day-group">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height={140} />
          ))}
        </div>
      ) : groups.length ? (
        <div className="view" style={{ gap: 22 }}>
          {groups.map((g) => (
            <section key={g.key} className="day-group" aria-label={g.label}>
              <h3>
                <span>{g.label}</span>
                {g.points ? <span>+{fmtPts(g.points)} pts</span> : null}
              </h3>
              {g.items.map((item) =>
                item.type === "purchase" ? (
                  <PurchaseCard key={item.id} item={item} open={openIds.has(item.id)} onToggle={() => toggle(item.id)} />
                ) : (
                  <EventCard key={item.id} item={item} />
                ),
              )}
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
  );
}
