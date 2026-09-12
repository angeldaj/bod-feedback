"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import {
  RESPONSES,
  alerts,
  aspectAverages,
  byMomento,
  bySucursal,
  computeKpis,
  filterByRange,
  filterBySucursal,
  overTime,
  ratingDistribution,
  recentWithComments,
  temaCounts,
  RANGES,
  type RangeKey,
} from "@/lib/mock";
import { ledgerContainer, ledgerItem } from "./motion";
import { FilterBar } from "./filter-bar";
import { Panel } from "./panel";
import { StatTile } from "./stat-tile";
import {
  AspectRadar,
  MomentoLegend,
  MomentoPie,
  RatingBars,
  SucursalBars,
  TemaBars,
  TrendArea,
} from "./charts";
import { AlertsPanel } from "./alerts-panel";
import { Voices } from "./voices";
import { relativeTime } from "./format";

export function DashboardView() {
  const [range, setRange] = React.useState<RangeKey>("30d");
  const [sucursal, setSucursal] = React.useState<string | "all">("all");
  const [resolvedIds, setResolvedIds] = React.useState<Set<string>>(
    () => new Set(RESPONSES.filter((r) => r.resuelto).map((r) => r.id)),
  );

  const toggleResolved = React.useCallback((id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rangeLabel =
    RANGES.find((r) => r.key === range)?.label.toLowerCase() ?? "";

  const data = React.useMemo(() => {
    const scoped = filterBySucursal(RESPONSES, sucursal);
    const current = filterByRange(scoped, range);
    const rangeOnly = filterByRange(RESPONSES, range); // para comparar sucursales
    return {
      current,
      kpis: computeKpis(RESPONSES, range, sucursal),
      trend: overTime(current),
      ratings: ratingDistribution(current),
      aspects: aspectAverages(current),
      momento: byMomento(current),
      sucursales: bySucursal(rangeOnly),
      temas: temaCounts(current).slice(0, 7),
      alertList: alerts(current),
      voices: recentWithComments(current, 10),
    };
  }, [range, sucursal]);

  const openAlerts = data.alertList.filter((r) => !resolvedIds.has(r.id)).length;
  const lastResponse = RESPONSES[RESPONSES.length - 1];
  const { kpis } = data;

  return (
    <main className="@container/dash relative z-[1] mx-auto w-full max-w-[1360px] px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      {/* ---------- Cabecera ---------- */}
      <motion.header
        variants={ledgerContainer}
        initial="hidden"
        animate="enter"
        className="flex flex-col gap-6 border-b border-hair-div pb-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <motion.div variants={ledgerItem} className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center border border-gold font-serif text-[26px] leading-none text-gold">
              B
            </div>
            <div>
              <div className="pl-[0.3em] font-serif text-[22px] uppercase leading-none tracking-[0.3em] text-cream">
                La Bodega
              </div>
              <div className="mt-1.5 text-[11px] uppercase tracking-[0.3em] text-label">
                Libro de Sala · Satisfacción
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={ledgerItem}
            className="flex items-center gap-5"
          >
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping bg-gold/60 motion-reduce:hidden" />
                  <span className="relative inline-flex size-2 bg-gold" />
                </span>
                <span className="text-[13px] text-body">En vivo</span>
              </div>
              <div className="mt-1 text-[12px] uppercase tracking-[0.14em] text-label">
                Última respuesta {relativeTime(lastResponse.createdAt)}
              </div>
            </div>
            <Link
              href="/satisfaccion"
              className="hidden items-center gap-1.5 border border-hair-ghost px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-body transition-colors hover:border-gold hover:text-gold-accent active:scale-[0.97] sm:inline-flex"
            >
              Ver encuesta
              <ArrowUpRight className="size-3.5" />
            </Link>
          </motion.div>
        </div>

        <motion.div variants={ledgerItem}>
          <FilterBar
            range={range}
            onRange={setRange}
            sucursal={sucursal}
            onSucursal={setSucursal}
          />
        </motion.div>
      </motion.header>

      {/* ---------- Pulso (KPIs) ---------- */}
      <motion.section
        variants={ledgerContainer}
        initial="hidden"
        animate="enter"
        className="mt-6 grid grid-cols-1 gap-4 @xl/dash:grid-cols-2 @5xl/dash:grid-cols-4"
      >
        <StatTile
          eyebrow="Satisfacción general"
          value={kpis.avgOverall}
          decimals={1}
          outOf="/ 5"
          delta={kpis.deltaAvg}
          deltaSuffix=""
          footnote={`Media de ${kpis.total.toLocaleString("es-VE")} respuestas en ${rangeLabel}.`}
        />
        <StatTile
          eyebrow="Respuestas recibidas"
          value={kpis.total}
          delta={range === "all" ? null : kpis.deltaTotal}
          footnote="Encuestas completadas en el periodo."
        />
        <StatTile
          eyebrow="Tasa de recomendación"
          value={kpis.promoterRate}
          suffix="%"
          delta={range === "all" ? null : kpis.deltaPromoter}
          deltaSuffix=" pts"
          footnote={`Notas de 4★ y 5★. ${kpis.detractorRate}% dieron 1★–2★.`}
        />
        <StatTile
          eyebrow="Alertas por atender"
          value={openAlerts}
          accent="terracotta"
          footnote={
            openAlerts > 0
              ? "Notas ≤2 con contacto. Requieren llamada del encargado."
              : "Ninguna queja abierta con contacto pendiente."
          }
        />
      </motion.section>

      {/* ---------- Gráficas ---------- */}
      <motion.section
        variants={ledgerContainer}
        initial="hidden"
        animate="enter"
        className="mt-4 grid grid-cols-1 gap-4 @3xl/dash:grid-cols-12"
      >
        <Panel
          eyebrow="Tendencia de satisfacción"
          aside="por semana"
          className="@3xl/dash:col-span-12 @5xl/dash:col-span-8"
        >
          <TrendArea data={data.trend} />
        </Panel>

        <Panel
          eyebrow="Franja del día"
          className="@3xl/dash:col-span-12 @5xl/dash:col-span-4"
        >
          <MomentoPie data={data.momento} />
          <MomentoLegend data={data.momento} />
        </Panel>

        <Panel
          eyebrow="Distribución de notas"
          aside="1 a 5"
          className="@3xl/dash:col-span-6 @5xl/dash:col-span-4"
        >
          <RatingBars data={data.ratings} />
        </Panel>

        <Panel
          eyebrow="Los cuatro aspectos"
          className="@3xl/dash:col-span-6 @5xl/dash:col-span-4"
        >
          <AspectRadar data={data.aspects} />
        </Panel>

        <Panel
          eyebrow="Por sucursal"
          aside="todas"
          className="@3xl/dash:col-span-12 @5xl/dash:col-span-4"
          bodyClassName="flex items-center"
        >
          <SucursalBars data={data.sucursales} className="!aspect-auto h-[200px] w-full" />
        </Panel>

        <Panel
          eyebrow="Seguimiento de quejas"
          aside="a mano"
          className="@3xl/dash:col-span-12 @5xl/dash:col-span-7"
          bodyClassName="max-h-[420px]"
        >
          <AlertsPanel
            items={data.alertList}
            resolvedIds={resolvedIds}
            onToggle={toggleResolved}
          />
        </Panel>

        <Panel
          eyebrow="Qué mejorar"
          aside="temas"
          className="@3xl/dash:col-span-12 @5xl/dash:col-span-5"
        >
          {data.temas.length > 0 ? (
            <TemaBars data={data.temas} />
          ) : (
            <p className="py-12 text-center font-serif text-[18px] italic text-muted-ink">
              Sin temas señalados en este periodo.
            </p>
          )}
        </Panel>

        <Panel
          eyebrow="Voces de la sala"
          aside="lo que nos dijeron"
          className="@3xl/dash:col-span-12"
          bodyClassName="@3xl/dash:columns-2 @3xl/dash:gap-8"
        >
          <Voices items={data.voices} />
        </Panel>
      </motion.section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-hair-div pt-5 text-[12px] uppercase tracking-[0.16em] text-label">
        <span>Puerto Ordaz · Venezuela</span>
        <span>Datos de ejemplo · {RESPONSES.length.toLocaleString("es-VE")} respuestas simuladas</span>
      </footer>
    </main>
  );
}
