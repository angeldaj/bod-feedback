"use client";

import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { PointsPoint } from "./data";

/**
 * Points earned per month. An area chart reads the momentum at a glance; colours
 * come from the club palette and adapt per theme so it stays legible on both the
 * warm-dark and the cream ground.
 */

const chartConfig = {
  earned: { label: "Puntos ganados" },
} satisfies ChartConfig;

export function PointsChart({
  theme,
  series,
}: {
  theme: "day" | "night";
  /** Serie mensual derivada de la actividad real del socio (`/me/activity`). */
  series: PointsPoint[];
}) {
  const reduce = useReducedMotion();
  const day = theme === "day";

  if (!series.length) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center text-center text-sm text-muted-ink sm:h-[260px]">
        Todavía no tienes puntos sumados para graficar este mes.
      </div>
    );
  }

  const gold = "#d9a94a";
  const goldHi = day ? "#c8901f" : "#efc77e";
  const axis = day ? "#7e6150" : "#8e8267";
  const grid = day ? "rgba(74,43,22,0.12)" : "rgba(217,169,74,0.16)";

  return (
    <ChartContainer
      config={chartConfig}
      className="!aspect-auto h-[240px] w-full sm:h-[260px]"
    >
      <AreaChart
        data={series}
        margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
      >
        <defs>
          <linearGradient id="mc-points-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gold} stopOpacity={day ? 0.42 : 0.34} />
            <stop offset="100%" stopColor={gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fill: axis, fontSize: 13 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
          tick={{ fill: axis, fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ stroke: gold, strokeOpacity: 0.35 }}
          content={
            <ChartTooltipContent
              className="border-hair-card bg-[#0f0b08] !shadow-none text-body [&_.text-foreground]:text-cream [&_.text-muted-foreground]:text-muted-ink"
              indicator="line"
              formatter={(value) => (
                <span className="font-serif text-[18px] leading-none text-gold">
                  {Number(value)}
                  <span className="ml-1 text-[12px] italic text-placeholder">
                    pts
                  </span>
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="earned"
          type="monotone"
          stroke={goldHi}
          strokeWidth={2.4}
          fill="url(#mc-points-fill)"
          dot={false}
          activeDot={{ r: 4, fill: goldHi, stroke: day ? "#fff8ee" : "#0b0906", strokeWidth: 2 }}
          isAnimationActive={!reduce}
          animationDuration={900}
        />
      </AreaChart>
    </ChartContainer>
  );
}
