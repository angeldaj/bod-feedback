"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Label,
  LabelList,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CHART_ANIM_MS } from "./motion";
import {
  AXIS_TEXT,
  AXIS_TEXT_HI,
  CANDLE,
  GOLD_RAMP,
  GRID,
  RATING_COLORS,
} from "./palette";

const tooltipCn =
  "border-hair-card bg-[#0f0b08] !shadow-none text-body [&_.text-foreground]:text-cream [&_.text-muted-foreground]:text-muted-ink";

// ---------------------------------------------------------------------------
// Tendencia de satisfacción (área)
// ---------------------------------------------------------------------------

const trendConfig = {
  media: { label: "Satisfacción media", color: CANDLE.gold },
} satisfies ChartConfig;

export function TrendArea({
  data,
  className,
}: {
  data: { label: string; media: number; respuestas: number }[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <ChartContainer
      config={trendConfig}
      className={className ?? "!aspect-auto h-[260px] w-full"}
    >
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="lb-fill-media" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CANDLE.gold} stopOpacity={0.38} />
            <stop offset="100%" stopColor={CANDLE.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={24}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tickLine={false}
          axisLine={false}
          width={40}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ stroke: CANDLE.gold, strokeOpacity: 0.35 }}
          content={
            <ChartTooltipContent
              className={tooltipCn}
              indicator="line"
              formatter={(value, _name, item) => (
                <div className="flex flex-col gap-0.5">
                  <span className="font-serif text-[18px] leading-none text-gold">
                    {Number(value).toFixed(1)}{" "}
                    <span className="text-[12px] italic text-placeholder">
                      / 5
                    </span>
                  </span>
                  <span className="text-[11px] text-muted-ink">
                    {item?.payload?.respuestas} respuestas
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="media"
          type="monotone"
          stroke={CANDLE.gold}
          strokeWidth={2}
          fill="url(#lb-fill-media)"
          dot={false}
          activeDot={{
            r: 4,
            fill: CANDLE.goldHi,
            stroke: "#0b0906",
            strokeWidth: 2,
          }}
          isAnimationActive={!reduce}
          animationDuration={CHART_ANIM_MS}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Distribución de notas (barras verticales, escala de calor por sentimiento)
// ---------------------------------------------------------------------------

const ratingConfig = {
  cantidad: { label: "Respuestas" },
} satisfies ChartConfig;

export function RatingBars({
  data,
  className,
}: {
  data: { nota: string; cantidad: number; valor: number }[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <ChartContainer
      config={ratingConfig}
      className={className ?? "!aspect-auto h-[220px] w-full"}
    >
      <BarChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="nota"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fill: AXIS_TEXT_HI, fontSize: 13 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
          tick={{ fill: AXIS_TEXT, fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(217,169,74,0.06)" }}
          content={<ChartTooltipContent className={tooltipCn} hideIndicator />}
        />
        <Bar
          dataKey="cantidad"
          radius={0}
          maxBarSize={64}
          isAnimationActive={!reduce}
          animationDuration={CHART_ANIM_MS}
        >
          {data.map((d) => (
            <Cell key={d.valor} fill={RATING_COLORS[d.valor]} />
          ))}
          <LabelList
            dataKey="cantidad"
            position="top"
            offset={8}
            fill={AXIS_TEXT_HI}
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Radar de aspectos (la forma de la experiencia)
// ---------------------------------------------------------------------------

const aspectConfig = {
  media: { label: "Media", color: CANDLE.gold },
} satisfies ChartConfig;

export function AspectRadar({
  data,
  className,
}: {
  data: { aspecto: string; media: number }[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <ChartContainer
      config={aspectConfig}
      className={className ?? "!aspect-auto mx-auto h-[260px] w-full"}
    >
      <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <ChartTooltip
          content={
            <ChartTooltipContent
              className={tooltipCn}
              formatter={(value) => (
                <span className="font-serif text-[16px] text-gold">
                  {Number(value).toFixed(1)}
                  <span className="text-[12px] italic text-placeholder"> / 5</span>
                </span>
              )}
            />
          }
        />
        <PolarGrid stroke={GRID} />
        <PolarAngleAxis
          dataKey="aspecto"
          tick={{ fill: AXIS_TEXT_HI, fontSize: 12 }}
        />
        <PolarRadiusAxis
          domain={[0, 5]}
          tick={false}
          axisLine={false}
          tickCount={6}
        />
        <Radar
          dataKey="media"
          stroke={CANDLE.gold}
          strokeWidth={2}
          fill={CANDLE.gold}
          fillOpacity={0.18}
          dot={{ r: 3, fill: CANDLE.goldHi, strokeWidth: 0 }}
          isAnimationActive={!reduce}
          animationDuration={CHART_ANIM_MS}
        />
      </RadarChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Reparto por momento del día (pie / dona) — recharts
// ---------------------------------------------------------------------------

export function MomentoPie({
  data,
  className,
}: {
  data: { momento: string; cantidad: number }[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const total = data.reduce((s, d) => s + d.cantidad, 0);

  const config = React.useMemo<ChartConfig>(() => {
    const c: ChartConfig = {};
    data.forEach((d, i) => {
      c[d.momento] = { label: d.momento, color: GOLD_RAMP[i % GOLD_RAMP.length] };
    });
    return c;
  }, [data]);

  return (
    <ChartContainer
      config={config}
      className={className ?? "!aspect-auto mx-auto h-[260px] w-full"}
    >
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              className={tooltipCn}
              nameKey="momento"
              formatter={(value, name) => (
                <span className="flex items-center gap-2">
                  <span className="text-muted-ink">{name}</span>
                  <span className="font-medium text-cream tabular-nums">
                    {Number(value).toLocaleString("es-VE")}
                    <span className="ml-1 text-placeholder">
                      ({total ? Math.round((Number(value) / total) * 100) : 0}%)
                    </span>
                  </span>
                </span>
              )}
            />
          }
        />
        <Pie
          data={data}
          dataKey="cantidad"
          nameKey="momento"
          innerRadius={62}
          outerRadius={96}
          paddingAngle={2}
          strokeWidth={1}
          stroke="#0b0906"
          isAnimationActive={!reduce}
          animationDuration={CHART_ANIM_MS}
        >
          {data.map((d, i) => (
            <Cell key={d.momento} fill={GOLD_RAMP[i % GOLD_RAMP.length]} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !("cx" in viewBox)) return null;
              const { cx, cy } = viewBox as { cx: number; cy: number };
              return (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan
                    x={cx}
                    y={cy - 6}
                    className="fill-cream font-serif"
                    fontSize={30}
                  >
                    {total.toLocaleString("es-VE")}
                  </tspan>
                  <tspan
                    x={cx}
                    y={cy + 16}
                    className="fill-[#8e8267]"
                    fontSize={11}
                    letterSpacing="0.18em"
                  >
                    VISITAS
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// Leyenda del pie, renderizada aparte para controlar el estilo de marca.
export function MomentoLegend({
  data,
}: {
  data: { momento: string; cantidad: number }[];
}) {
  const total = data.reduce((s, d) => s + d.cantidad, 0);
  return (
    <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2">
      {data.map((d, i) => (
        <li
          key={d.momento}
          className="flex items-center justify-between gap-2 text-[13px]"
        >
          <span className="flex items-center gap-2 text-body">
            <span
              aria-hidden
              className="size-2.5 shrink-0"
              style={{ background: GOLD_RAMP[i % GOLD_RAMP.length] }}
            />
            {d.momento}
          </span>
          <span className="tabular-nums text-muted-ink">
            {total ? Math.round((d.cantidad / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Comparación por sucursal (barras horizontales de media)
// ---------------------------------------------------------------------------

const sucursalConfig = {
  media: { label: "Satisfacción media", color: CANDLE.gold },
} satisfies ChartConfig;

export function SucursalBars({
  data,
  className,
}: {
  data: { sucursal: string; media: number; respuestas: number }[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <ChartContainer
      config={sucursalConfig}
      className={className ?? "!aspect-auto h-[200px] w-full"}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" domain={[0, 5]} hide />
        <YAxis
          type="category"
          dataKey="sucursal"
          tickLine={false}
          axisLine={false}
          width={78}
          tick={{ fill: AXIS_TEXT_HI, fontSize: 13 }}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(217,169,74,0.06)" }}
          content={
            <ChartTooltipContent
              className={tooltipCn}
              formatter={(value, _n, item) => (
                <span className="flex flex-col gap-0.5">
                  <span className="font-serif text-[16px] text-gold">
                    {Number(value).toFixed(1)} / 5
                  </span>
                  <span className="text-[11px] text-muted-ink">
                    {item?.payload?.respuestas} respuestas
                  </span>
                </span>
              )}
            />
          }
        />
        <Bar
          dataKey="media"
          radius={0}
          barSize={22}
          fill={CANDLE.gold}
          isAnimationActive={!reduce}
          animationDuration={CHART_ANIM_MS}
        >
          <LabelList
            dataKey="media"
            position="right"
            offset={10}
            fill={AXIS_TEXT_HI}
            fontSize={13}
            formatter={(v) => (typeof v === "number" ? v.toFixed(1) : v)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Temas a mejorar (barras horizontales, tono de "algo que atender")
// ---------------------------------------------------------------------------

const temaConfig = {
  cantidad: { label: "Menciones" },
} satisfies ChartConfig;

export function TemaBars({
  data,
  className,
}: {
  data: { tema: string; cantidad: number }[];
  className?: string;
}) {
  const reduce = useReducedMotion();
  const max = data.length ? data[0].cantidad : 0;
  return (
    <ChartContainer
      config={temaConfig}
      className={className ?? "!aspect-auto h-[280px] w-full"}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 2, right: 44, left: 4, bottom: 2 }}
      >
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="tema"
          tickLine={false}
          axisLine={false}
          width={128}
          tick={{ fill: AXIS_TEXT_HI, fontSize: 13 }}
        />
        <ChartTooltip
          cursor={{ fill: "rgba(200,84,58,0.07)" }}
          content={<ChartTooltipContent className={tooltipCn} hideIndicator />}
        />
        <Bar
          dataKey="cantidad"
          radius={0}
          barSize={18}
          isAnimationActive={!reduce}
          animationDuration={CHART_ANIM_MS}
        >
          {data.map((d) => {
            // Cuanto más frecuente el reclamo, más intensa la terracota.
            const t = max ? d.cantidad / max : 0;
            const color = t > 0.66 ? CANDLE.terracotta : t > 0.33 ? "#b06a3f" : CANDLE.brass;
            return <Cell key={d.tema} fill={color} />;
          })}
          <LabelList
            dataKey="cantidad"
            position="right"
            offset={10}
            fill={AXIS_TEXT_HI}
            fontSize={13}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
