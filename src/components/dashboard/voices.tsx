"use client";

import * as React from "react";
import { cn } from "cn";
import type { SurveyResponse } from "@/lib/mock";
import { RATING_COLORS } from "./palette";
import { relativeTime } from "./format";

export function Voices({ items }: { items: SurveyResponse[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center font-serif text-[18px] italic text-muted-ink">
        Sin comentarios en este periodo.
      </p>
    );
  }
  return (
    <ul className="flex flex-col">
      {items.map((r) => (
        <li
          key={r.id}
          className="break-inside-avoid border-t border-hair-div py-3.5 first:border-t-0"
        >
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="size-2 shrink-0"
              style={{ background: RATING_COLORS[r.overall] }}
            />
            <span className="text-[12px] uppercase tracking-[0.12em] text-label">
              {r.overall}★ · {r.sucursal} · {r.momento} ·{" "}
              {relativeTime(r.createdAt)}
            </span>
          </div>
          <p
            className={cn(
              "mt-1.5 font-serif text-[17px] italic leading-snug",
              r.overall >= 4 ? "text-body" : "text-muted-ink",
            )}
          >
            “{r.comentario}”
          </p>
          {r.nombre && (
            <p className="mt-1 text-[13px] tracking-[0.02em] text-placeholder">
              — {r.nombre}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
