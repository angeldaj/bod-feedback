"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AtSign, Check, Phone, RotateCcw } from "lucide-react";
import { cn } from "cn";
import type { SurveyResponse } from "@/lib/mock";
import { EASE_BRAND } from "./motion";
import { relativeTime } from "./format";

function ContactLine({ contacto }: { contacto: string }) {
  const isPhone = /[+\d]/.test(contacto[0] ?? "");
  const isHandle = contacto.startsWith("@");
  const Icon = isPhone ? Phone : AtSign;
  const href = isPhone
    ? `tel:${contacto.replace(/[^\d+]/g, "")}`
    : isHandle
      ? undefined
      : `mailto:${contacto}`;
  const inner = (
    <>
      <Icon className="size-3.5 text-gold/70" />
      {contacto}
    </>
  );
  return href ? (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] text-body underline-offset-4 hover:text-gold-hi hover:underline"
    >
      {inner}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-body">
      {inner}
    </span>
  );
}

function AlertRow({
  r,
  resolved,
  onToggle,
}: {
  r: SurveyResponse;
  resolved: boolean;
  onToggle: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={!reduce}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: EASE_BRAND }}
      className="flex gap-4 border-t border-hair-div py-4 first:border-t-0"
    >
      {/* Nota */}
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center border font-serif text-[24px] leading-none",
          r.overall === 1
            ? "border-[#c8543a]/60 bg-[#c8543a]/12 text-[#e07a63]"
            : "border-[#c8543a]/40 bg-[#c8543a]/8 text-[#d9694f]",
        )}
      >
        {r.overall}
      </div>

      {/* Cuerpo */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[15px] text-cream">
            {r.nombre || "Anónimo"}
          </span>
          <ContactLine contacto={r.contacto} />
        </div>
        <div className="mt-0.5 text-[12px] uppercase tracking-[0.12em] text-label">
          {r.sucursal} · {r.momento} · {relativeTime(r.createdAt)} · {r.id}
        </div>
        {r.comentario && (
          <p className="mt-2 text-[14px] leading-snug text-body">
            “{r.comentario}”
          </p>
        )}
        {r.temas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {r.temas.map((t) => (
              <span
                key={t}
                className="border border-hair-chip px-2 py-0.5 text-[11px] uppercase tracking-[0.1em] text-muted-ink"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Acción */}
      <div className="shrink-0 self-start">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex items-center gap-1.5 border px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.1em] transition-colors active:scale-[0.97]",
            resolved
              ? "border-hair-ghost text-muted-ink hover:border-gold hover:text-gold-accent"
              : "border-gold/50 text-gold-accent hover:bg-gold hover:text-ink",
          )}
        >
          {resolved ? (
            <>
              <RotateCcw className="size-3.5" /> Reabrir
            </>
          ) : (
            <>
              <Check className="size-3.5" /> Atender
            </>
          )}
        </button>
      </div>
    </motion.li>
  );
}

export function AlertsPanel({
  items,
  resolvedIds,
  onToggle,
}: {
  items: SurveyResponse[];
  resolvedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [tab, setTab] = React.useState<"pendientes" | "atendidas">("pendientes");

  const pendientes = items.filter((r) => !resolvedIds.has(r.id));
  const atendidas = items.filter((r) => resolvedIds.has(r.id));
  const shown = tab === "pendientes" ? pendientes : atendidas;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex items-center gap-4 border-b border-hair-div pb-3">
        {(
          [
            ["pendientes", "Pendientes", pendientes.length],
            ["atendidas", "Atendidas", atendidas.length],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={cn(
              "group/tab inline-flex items-center gap-2 pb-1 text-[13px] uppercase tracking-[0.14em] transition-colors",
              tab === key ? "text-cream" : "text-label hover:text-muted-ink",
            )}
          >
            {label}
            <span
              className={cn(
                "min-w-5 border px-1.5 text-center text-[11px] tabular-nums",
                key === "pendientes" && count > 0
                  ? "border-[#c8543a]/50 text-[#d9694f]"
                  : "border-hair-chip text-muted-ink",
              )}
            >
              {count}
            </span>
            <span
              aria-hidden
              className={cn(
                "block h-px bg-gold transition-transform duration-300",
                tab === key ? "scale-x-100" : "scale-x-0",
              )}
              style={{ transformOrigin: "left" }}
            />
          </button>
        ))}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto pr-1">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((r) => (
            <AlertRow
              key={r.id}
              r={r}
              resolved={resolvedIds.has(r.id)}
              onToggle={() => onToggle(r.id)}
            />
          ))}
        </AnimatePresence>
        {shown.length === 0 && (
          <li className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Check className="size-6 text-gold/50" />
            <p className="font-serif text-[19px] italic text-muted-ink">
              {tab === "pendientes"
                ? "Sin alertas pendientes. La sala está en calma."
                : "Aún no hay alertas atendidas en este periodo."}
            </p>
          </li>
        )}
      </ul>
    </div>
  );
}
