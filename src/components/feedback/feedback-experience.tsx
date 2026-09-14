"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "motion/react";
import { AlertTriangle, ClipboardList, type LucideIcon } from "lucide-react";
import { FoodHero } from "@/components/feedback/food-hero";
import { SurveyExperience } from "@/components/satisfaccion/survey-experience";
import { IncidentExperience } from "@/components/reportar/incident-experience";

type Tab = "encuesta" | "urgencia";
type Theme = "day" | "night";

const TABS: { id: Tab; label: string; short: string; Icon: LucideIcon }[] = [
  { id: "encuesta", label: "Encuesta de satisfacción", short: "Encuesta", Icon: ClipboardList },
  { id: "urgencia", label: "Reporta una urgencia", short: "Urgencia", Icon: AlertTriangle },
];

// Deep-link: /feedback?tab=urgente (o #urgente/#reportar) abre la pestaña de
// urgencia; cualquier otra cosa (incl. los hashes de paso #overall…) es encuesta.
function readTab(): Tab {
  if (typeof window === "undefined") return "encuesta";
  const q = new URLSearchParams(window.location.search).get("tab");
  const h = window.location.hash.replace("#", "");
  const urgent = new Set(["urgente", "urgencia", "reportar"]);
  return urgent.has(q ?? "") || urgent.has(h) ? "urgencia" : "encuesta";
}

export function FeedbackExperience() {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("encuesta");
  const [theme, setTheme] = useState<Theme>("day");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Honra el deep-link al montar. Debe correr tras la hidratación (el server no
  // conoce la URL con query/hash), por eso el setState va dentro del efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTab(readTab()), []);

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

  const selectTab = useCallback((next: Tab, focus = false) => {
    setTab(next);
    // Refleja el estado en la URL para compartir/volver (sin recargar).
    try {
      const url = new URL(window.location.href);
      if (next === "urgencia") {
        url.searchParams.set("tab", "urgente");
        url.hash = "";
      } else {
        url.searchParams.delete("tab");
      }
      window.history.replaceState(null, "", url);
    } catch {
      /* no-op */
    }
    if (focus) {
      const i = TABS.findIndex((t) => t.id === next);
      tabRefs.current[i]?.focus();
    }
  }, []);

  // Navegación con flechas dentro del tablist (roving tabindex).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let ni = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") ni = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") ni = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") ni = 0;
    else if (e.key === "End") ni = TABS.length - 1;
    else return;
    e.preventDefault();
    selectTab(TABS[ni].id, true);
  };

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
        style={{ opacity: tab === "encuesta" ? 1 : 0 }}
      />
      <div
        aria-hidden="true"
        className="pop-page-glow pop-page-glow--urgent"
        style={{ opacity: tab === "urgencia" ? 1 : 0 }}
      />

      <main className="relative z-[1] flex min-h-dvh w-full flex-col items-center justify-center px-5 py-14 max-[560px]:px-3.5 max-[560px]:py-8">
        <div className="relative z-[1] flex w-full max-w-[720px] flex-col items-center">
          {/* Hero editorial de comida (marca sobre el scrim) */}
          <motion.header
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <FoodHero theme={theme} onToggleTheme={toggleTheme} />
          </motion.header>

          {/* Conmutador de pestañas */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            role="tablist"
            aria-label="Tipo de mensaje"
            onKeyDown={onKeyDown}
            className="mt-6 inline-flex rounded-full border border-hair-div bg-[var(--lb-input)] p-1.5 backdrop-blur-md"
          >
            {TABS.map((t, i) => {
              const active = tab === t.id;
              const activeInk = t.id === "urgencia" ? "#2a0f07" : "#12100c";
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`feedback-tab-${t.id}`}
                  aria-selected={active}
                  aria-controls={`feedback-panel-${t.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectTab(t.id)}
                  className="relative inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold transition-colors max-[560px]:px-4"
                  style={{ color: active ? activeInk : undefined }}
                >
                  {active && (
                    <motion.span
                      layoutId="feedback-tab-indicator"
                      className="absolute inset-0 -z-[1] rounded-full"
                      style={{
                        background:
                          t.id === "urgencia"
                            ? "linear-gradient(105deg, var(--lb-coral-hi), var(--lb-coral))"
                            : "linear-gradient(105deg, var(--lb-gold-hi), var(--lb-gold))",
                        boxShadow:
                          t.id === "urgencia"
                            ? "0 8px 20px -8px rgba(255,106,61,0.7)"
                            : "0 8px 20px -8px rgba(217,169,74,0.7)",
                      }}
                      transition={{ type: "spring", stiffness: 460, damping: 34 }}
                    />
                  )}
                  <t.Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                  <span className={active ? "" : "text-body"}>
                    <span className="max-[560px]:hidden">{t.label}</span>
                    <span className="hidden max-[560px]:inline">{t.short}</span>
                  </span>
                </button>
              );
            })}
          </motion.div>

          {/* Panel activo */}
          <div className="mt-6 w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                role="tabpanel"
                id={`feedback-panel-${tab}`}
                aria-labelledby={`feedback-tab-${tab}`}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {tab === "encuesta" ? (
                  <SurveyExperience embedded onUrgent={() => selectTab("urgencia", true)} />
                ) : (
                  <IncidentExperience embedded onSurvey={() => selectTab("encuesta", true)} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

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
