"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, MotionConfig, useReducedMotion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { FeedbackSplit, type Choice } from "@/components/feedback/feedback-split";

type Theme = "day" | "night";

// Deep-link: /feedback?tab=urgente (o #urgente/#reportar) abre directamente el
// reporte de urgencia; ?tab=encuesta salta a la encuesta. Sin parámetro se
// muestra el selector partido (null) para que la persona elija.
function readChoice(): Choice | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("tab");
  const h = window.location.hash.replace("#", "");
  const urgent = new Set(["urgente", "urgencia", "reportar"]);
  const survey = new Set(["encuesta", "satisfaccion"]);
  if (urgent.has(q ?? "") || urgent.has(h)) return "urgencia";
  if (survey.has(q ?? "") || survey.has(h)) return "encuesta";
  return null;
}

export function FeedbackExperience() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<Choice | null>(null);
  const [theme, setTheme] = useState<Theme>("day");

  // Honra el deep-link al montar. Debe correr tras la hidratación (el server no
  // conoce la URL con query/hash), por eso el setState va dentro del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSelected(readChoice()), []);

  // Recupera el tema elegido antes (día por defecto — la marca "Panadería de
  // día"). Corre tras la hidratación para no romper el markup del server.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("labodega-theme");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "day" || saved === "night") setTheme(saved);
    } catch {
      /* no-op */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "day" ? "night" : "day";
      try {
        localStorage.setItem("labodega-theme", next);
      } catch {
        /* no-op */
      }
      return next;
    });
  }, []);

  const selectChoice = useCallback((next: Choice | null) => {
    setSelected(next);
    // Refleja el estado en la URL para compartir/volver (sin recargar).
    try {
      const url = new URL(window.location.href);
      if (next === "urgencia") {
        url.searchParams.set("tab", "urgente");
        url.hash = "";
      } else if (next === "encuesta") {
        url.searchParams.set("tab", "encuesta");
        url.hash = "";
      } else {
        url.searchParams.delete("tab");
        url.hash = "";
      }
      window.history.replaceState(null, "", url);
    } catch {
      /* no-op */
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className={theme === "day" ? "day" : undefined}>
      {/* Fondo: base crema cálida + un pool de luz suave arriba que se
          desvanece en todas direcciones (dos variantes que cruzan al cambiar
          de pestaña). */}
      <div aria-hidden="true" className="pop-page-base" />
      <div
        aria-hidden="true"
        className="pop-page-glow pop-page-glow--warm"
        style={{ opacity: selected === "urgencia" ? 0 : 1 }}
      />
      <div
        aria-hidden="true"
        className="pop-page-glow pop-page-glow--urgent"
        style={{ opacity: selected === "urgencia" ? 1 : 0 }}
      />

      <main className="relative z-[1] flex min-h-dvh w-full flex-col items-center justify-center px-5 py-14 max-[560px]:px-3.5 max-[560px]:py-8">
        <div className="relative z-[1] flex w-full max-w-[940px] flex-col items-center">
          {/* Encabezado slim: marca + cambio de tema (sin el banner grande). */}
          <motion.header
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full items-center justify-between gap-4"
          >
            <div className="flex flex-col gap-1">
              <span className="font-serif text-[26px] font-semibold leading-none tracking-tight text-cream max-[560px]:text-[22px]">
                La Bodega
              </span>
              <span className="pl-[0.1em] text-[10.5px] font-medium uppercase tracking-[0.28em] text-label">
                Restaurante · Panadería
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "day" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
              title={theme === "day" ? "Modo oscuro" : "Modo claro"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hair-card bg-[var(--lb-input)] text-cream backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              <motion.span
                key={theme}
                initial={reduce ? false : { rotate: -90, opacity: 0, scale: 0.6 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="inline-flex"
              >
                {theme === "day" ? (
                  <Moon size={18} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Sun size={18} strokeWidth={2} aria-hidden="true" />
                )}
              </motion.span>
            </button>
          </motion.header>

          {/* Selector partido: elige encuesta o urgencia; al elegir, esa mitad
              se expande y revela su formulario. */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 w-full"
          >
            <FeedbackSplit selected={selected} onSelect={selectChoice} />
          </motion.div>

          <footer className="mt-8 flex w-full flex-wrap items-center justify-center gap-3 text-[13px] uppercase tracking-[0.12em] text-label">
            <span className="min-[560px]:hidden">Puerto Ordaz · Venezuela</span>
            <span className="hidden min-[560px]:inline">Gracias por acompañarnos</span>
          </footer>
        </div>
      </main>
      </div>
    </MotionConfig>
  );
}
