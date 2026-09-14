"use client";

import { useReducedMotion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { REWARDS } from "./club-data";

/**
 * "Escalera de recompensas": a horizontal bar chart where each bar is a reward
 * and its length is the points needed. It reads as a ladder — the first rung is
 * low on purpose — and turns the reward table into one glance. Colours come from
 * the club palette (gold ramp, coral for the top prize) and adapt per theme.
 */

const chartConfig = {
  points: { label: "Puntos" },
} satisfies ChartConfig;

const data = REWARDS.map((r) => ({ name: r.name, points: r.points }));

export function RewardsChart({ theme }: { theme: "day" | "night" }) {
  const reduce = useReducedMotion();
  const day = theme === "day";

  const nameFill = day ? "#3a2417" : "#efe2cd";
  const valueFill = day ? "#a9761a" : "#eec478";
  const barTop = day ? "#e9b84f" : "#f0c274";
  const barBottom = day ? "#d49a2f" : "#d9a94a";
  const coralTop = "#ff7a4d";
  const coralBottom = day ? "#e0492a" : "#f46842";

  return (
    <ChartContainer
      config={chartConfig}
      className="!aspect-auto h-[320px] w-full sm:h-[360px]"
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
        barCategoryGap="26%"
      >
        <defs>
          <linearGradient id="club-bar-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={barBottom} />
            <stop offset="100%" stopColor={barTop} />
          </linearGradient>
          <linearGradient id="club-bar-coral" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={coralBottom} />
            <stop offset="100%" stopColor={coralTop} />
          </linearGradient>
        </defs>
        <XAxis type="number" dataKey="points" hide domain={[0, 200]} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={128}
          tick={{ fill: nameFill, fontSize: 15, fontWeight: 600 }}
        />
        <Bar
          dataKey="points"
          radius={[8, 8, 8, 8]}
          isAnimationActive={!reduce}
          animationDuration={900}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={
                index === data.length - 1
                  ? "url(#club-bar-coral)"
                  : "url(#club-bar-gold)"
              }
            />
          ))}
          <LabelList
            dataKey="points"
            position="right"
            offset={12}
            formatter={(value) => `${value} pts`}
            style={{ fill: valueFill, fontSize: 15, fontWeight: 700 }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
