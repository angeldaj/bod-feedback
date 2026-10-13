"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion, type Variants } from "motion/react";
import { ArrowLeft, Search, X } from "lucide-react";
import { formatBs, formatUsd } from "@/components/pedidos/format";
import type { Menu, MenuItem, MenuSection } from "@/lib/menu-api";

const EASE = [0.22, 1, 0.36, 1] as const;

type Currency = "usd" | "bs";
const CURRENCY_KEY = "lb-menu-currency";

// La moneda elegida se recuerda en el navegador. Si no hay almacenamiento
// (modo privado, bloqueado), vale lo elegido mientras la página esté abierta.
let currencyInMemory: Currency | null = null;
const currencyListeners = new Set<() => void>();

function readCurrency(): Currency {
  if (currencyInMemory) return currencyInMemory;
  try {
    return localStorage.getItem(CURRENCY_KEY) === "bs" ? "bs" : "usd";
  } catch {
    return "usd";
  }
}

function writeCurrency(next: Currency) {
  currencyInMemory = next;
  try {
    localStorage.setItem(CURRENCY_KEY, next);
  } catch {
    /* sin almacenamiento: queda en memoria */
  }
  currencyListeners.forEach((listener) => listener());
}

function subscribeCurrency(listener: () => void) {
  currencyListeners.add(listener);
  return () => {
    currencyListeners.delete(listener);
  };
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const ROMAN: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];
function roman(n: number) {
  let out = "";
  for (const [value, numeral] of ROMAN) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

/**
 * Carta de un local (`/menu/<slug>`): solo para ver, sin carrito ni fotos.
 * Tiene la estética de una carta impresa: secciones numeradas, líneas de
 * puntos hasta el precio y adornos dorados. La barra fija lleva las
 * secciones (sigue el scroll), el buscador y el cambio entre $ y Bs.
 */
export function MenuView({ menu }: { menu: Menu }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const currency = useSyncExternalStore(subscribeCurrency, readCurrency, () => "usd" as Currency);
  const [active, setActive] = useState(menu.sections[0]?.id ?? "");
  const reduce = useReducedMotion();
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  // Mientras el scroll lo dispara un toque en la barra, el seguimiento espera.
  const jumping = useRef<number | null>(null);

  const q = normalize(query.trim());
  const results = useMemo(
    () => (q ? menu.items.filter((item) => normalize(`${item.name} ${item.description}`).includes(q)) : []),
    [menu.items, q],
  );

  const bySection = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menu.items) {
      const list = map.get(item.sectionId) ?? [];
      list.push(item);
      map.set(item.sectionId, list);
    }
    return map;
  }, [menu.items]);

  const sections = menu.sections.filter((section) => (bySection.get(section.id)?.length ?? 0) > 0);

  // La sección que cruza la franja de arriba de la pantalla es la activa.
  useEffect(() => {
    if (q) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (jumping.current !== null) return;
        const hit = entries.find((entry) => entry.isIntersecting);
        if (hit) setActive((hit.target as HTMLElement).dataset.section ?? "");
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sectionRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [q, sections.length]);

  function jumpTo(id: string) {
    const element = sectionRefs.current.get(id);
    if (!element) return;
    setActive(id);
    if (jumping.current !== null) window.clearTimeout(jumping.current);
    jumping.current = window.setTimeout(() => (jumping.current = null), 900);
    element.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function closeSearch() {
    setQuery("");
    setSearching(false);
  }

  const rate = menu.rate;
  const showBs = currency === "bs" && rate !== null;

  return (
    <MenuShell>
      <MenuHero name={menu.name} />

      <div className="sticky top-0 z-20 -mx-4 border-y border-hair-div bg-[rgba(11,9,6,0.88)] backdrop-blur-xl md:-mx-8">
        <div className="mx-auto flex h-[58px] max-w-[1200px] items-center gap-2 px-4 md:px-8">
          <AnimatePresence mode="wait" initial={false}>
            {searching ? (
              <motion.label
                key="search"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="relative flex min-w-0 flex-1 items-center"
              >
                <span className="sr-only">Buscar en el menú</span>
                <Search size={17} className="pointer-events-none absolute left-0 text-gold-accent" aria-hidden="true" />
                <input
                  autoFocus
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                  placeholder="Busca un plato…"
                  className="w-full bg-transparent py-2 pr-2 pl-7 font-serif text-[20px] italic text-cream outline-none placeholder:text-placeholder [&::-webkit-search-cancel-button]:hidden"
                />
              </motion.label>
            ) : (
              <motion.div
                key="tabs"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="min-w-0 flex-1"
              >
                {sections.length > 1 && <SectionNav sections={sections} active={active} onJump={jumpTo} />}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => (searching ? closeSearch() : setSearching(true))}
            aria-label={searching ? "Cerrar búsqueda" : "Buscar en el menú"}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-hair-div text-body transition-colors hover:border-gold-accent hover:text-cream focus-visible:outline-2 focus-visible:outline-gold-accent"
          >
            {searching ? <X size={17} aria-hidden="true" /> : <Search size={17} aria-hidden="true" />}
          </button>
          {rate !== null && <CurrencyToggle value={currency} onChange={writeCurrency} />}
        </div>
      </div>

      {menu.items.length === 0 ? (
        <p className="py-24 text-center font-serif text-[22px] italic text-muted-ink">
          Estamos preparando este menú. Vuelve pronto.
        </p>
      ) : q ? (
        <section aria-live="polite" className="pt-10">
          {results.length === 0 ? (
            <p className="py-16 text-center font-serif text-[22px] italic text-muted-ink">
              No encontramos “{query.trim()}”. Prueba con otra palabra.
            </p>
          ) : (
            <>
              <p className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.28em] text-label">
                {results.length === 1 ? "1 plato" : `${results.length} platos`}
              </p>
              <ItemGrid items={results} rate={rate} showBs={showBs} />
            </>
          )}
        </section>
      ) : (
        <div className="flex flex-col gap-20 pt-14 md:gap-24 md:pt-20">
          {sections.map((section, index) => (
            <section
              key={section.id}
              data-section={section.id}
              ref={(element) => {
                if (element) sectionRefs.current.set(section.id, element);
                else sectionRefs.current.delete(section.id);
              }}
              aria-labelledby={`seccion-${section.id}`}
              className="scroll-mt-[84px]"
            >
              <SectionHeading id={`seccion-${section.id}`} number={index + 1} name={section.name} />
              <ItemGrid items={bySection.get(section.id) ?? []} rate={rate} showBs={showBs} />
            </section>
          ))}
        </div>
      )}

      <MenuFooter rate={rate} />
    </MenuShell>
  );
}

/* ----------------------------------------------------------- Portada ---- */

function MenuHero({ name }: { name: string }) {
  return (
    <motion.header
      variants={stagger}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center gap-5 pt-14 pb-12 text-center md:pt-20 md:pb-16"
    >
      <motion.a
        href="/"
        variants={rise}
        className="flex flex-col items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-accent"
        aria-label="La Bodega, ir al inicio"
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[#1a120b] ring-1 ring-hair-chip">
          {/* eslint-disable-next-line @next/next/no-img-element -- asset local */}
          <img src="/logo-bodega.png" alt="" className="size-10 object-contain" />
        </span>
        <span className="text-[15px] font-bold uppercase tracking-[0.32em] text-cream">La Bodega</span>
      </motion.a>

      <Ornament />

      <div className="overflow-hidden pb-2">
        <motion.h1
          variants={{
            hidden: { y: "105%" },
            show: { y: 0, transition: { duration: 1.1, ease: EASE } },
          }}
          className="font-serif text-[clamp(72px,16vw,148px)] font-semibold italic leading-[0.9] tracking-[-0.01em] text-cream"
        >
          Carta
        </motion.h1>
      </div>

      <motion.p
        variants={rise}
        className="flex items-center gap-3 text-[13px] font-medium uppercase tracking-[0.34em] text-gold-accent"
      >
        <span aria-hidden="true" className="h-px w-6 bg-gold-accent/60" />
        {name}
        <span aria-hidden="true" className="h-px w-6 bg-gold-accent/60" />
      </motion.p>
    </motion.header>
  );
}

/** Línea, rombo, línea: se dibuja desde el centro. */
function Ornament({ className = "" }: { className?: string }) {
  const line: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    show: { scaleX: 1, opacity: 1, transition: { duration: 1.1, ease: EASE } },
  };
  return (
    <motion.div variants={stagger} aria-hidden="true" className={`flex items-center gap-3 ${className}`}>
      <motion.span variants={line} className="h-px w-16 origin-right bg-gradient-to-l from-gold-accent/80 to-transparent md:w-24" />
      <motion.span
        variants={{
          hidden: { scale: 0, rotate: 0 },
          show: { scale: 1, rotate: 45, transition: { duration: 0.7, ease: EASE } },
        }}
        className="size-1.5 bg-gold-accent"
      />
      <motion.span variants={line} className="h-px w-16 origin-left bg-gradient-to-r from-gold-accent/80 to-transparent md:w-24" />
    </motion.div>
  );
}

/* ------------------------------------------------------- Barra fija ---- */

function SectionNav({
  sections,
  active,
  onJump,
}: {
  sections: MenuSection[];
  active: string;
  onJump: (id: string) => void;
}) {
  const navRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // La pestaña activa se mantiene a la vista en la barra.
  useEffect(() => {
    const nav = navRef.current;
    const tab = nav?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!nav || !tab) return;
    const left = tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2;
    nav.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [active, reduce]);

  return (
    <nav
      ref={navRef}
      aria-label="Secciones de la carta"
      className="edge-fade-x relative flex items-center gap-1 overflow-x-auto md:[mask-image:none] md:[-webkit-mask-image:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {sections.map((section) => {
        const on = section.id === active;
        return (
          <button
            key={section.id}
            type="button"
            data-tab={section.id}
            aria-current={on ? "true" : undefined}
            onClick={() => onJump(section.id)}
            className={`relative shrink-0 px-3 py-2 text-[14px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-gold-accent ${
              on ? "text-cream" : "text-label hover:text-body"
            }`}
          >
            {section.name}
            {on && (
              <motion.span
                layoutId="menu-tab-underline"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
                className="absolute inset-x-3 bottom-0 h-[2px] bg-gold-accent"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function CurrencyToggle({ value, onChange }: { value: Currency; onChange: (next: Currency) => void }) {
  const options: { id: Currency; label: string }[] = [
    { id: "usd", label: "$" },
    { id: "bs", label: "Bs" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Moneda de los precios"
      className="relative flex shrink-0 rounded-full border border-hair-div p-0.5"
    >
      {options.map((option) => {
        const on = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(option.id)}
            className={`relative z-[1] h-8 min-w-9 rounded-full px-2.5 text-[14px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-gold-accent ${
              on ? "text-ink" : "text-body hover:text-cream"
            }`}
          >
            {on && (
              <motion.span
                layoutId="menu-currency-pill"
                transition={{ type: "spring", stiffness: 480, damping: 34 }}
                className="absolute inset-0 -z-[1] rounded-full bg-gold-accent"
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------- Secciones ---- */

function SectionHeading({ id, number, name }: { id: string; number: number; name: string }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      className="mb-10 flex flex-col items-center gap-3 text-center md:mb-14"
    >
      <motion.span variants={rise} className="font-serif text-[18px] italic text-gold-accent">
        {roman(number)}
      </motion.span>
      <motion.h2
        id={id}
        variants={rise}
        className="font-serif text-[clamp(38px,6vw,56px)] font-semibold leading-[1] tracking-[-0.005em] text-cream text-balance"
      >
        {name}
      </motion.h2>
      <Ornament className="mt-1" />
    </motion.div>
  );
}

function ItemGrid({ items, rate, showBs }: { items: MenuItem[]; rate: number | null; showBs: boolean }) {
  return (
    <ul className="mx-auto grid w-full max-w-[1040px] grid-cols-1 gap-x-16 gap-y-8 md:grid-cols-2 md:gap-y-10">
      {items.map((item, index) => (
        <MenuEntry key={item.id} item={item} rate={rate} showBs={showBs} delay={(index % 2) * 0.08} />
      ))}
    </ul>
  );
}

function MenuEntry({
  item,
  rate,
  showBs,
  delay,
}: {
  item: MenuItem;
  rate: number | null;
  showBs: boolean;
  delay: number;
}) {
  const price = showBs && rate !== null ? formatBs(item.price * rate) : formatUsd(item.price);
  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className="group"
    >
      <div className="flex items-baseline gap-3">
        <h3 className="min-w-0 text-[18px] font-semibold uppercase leading-[1.2] tracking-[0.05em] text-cream transition-colors duration-300 group-hover:text-gold-hi">
          {item.name}
        </h3>
        <span
          aria-hidden="true"
          className="min-w-6 flex-1 -translate-y-[5px] border-b border-dotted border-[rgba(217,169,74,0.32)] transition-colors duration-300 group-hover:border-[rgba(217,169,74,0.7)]"
        />
        <span className="relative shrink-0 overflow-hidden font-serif text-[22px] font-semibold leading-tight text-gold-accent tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={price}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="block"
            >
              {price}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      {item.description && (
        <p className="mt-1.5 max-w-[52ch] font-serif md:max-w-none md:pr-20 text-[18px] italic leading-snug text-muted-ink">{item.description}</p>
      )}
    </motion.li>
  );
}

/* -------------------------------------------------------------- Pie ---- */

function MenuFooter({ rate }: { rate: number | null }) {
  return (
    <motion.footer
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      className="mt-auto flex flex-col items-center gap-5 pt-24 text-center"
    >
      <Ornament />
      <motion.p variants={rise} className="max-w-[44ch] font-serif text-[17px] italic leading-relaxed text-muted-ink">
        Precios en dólares con IVA incluido
        {rate !== null ? `, en bolívares a la tasa BCV del día (${formatBs(rate)})` : ""}. Sujetos a disponibilidad.
      </motion.p>
      <motion.a
        variants={rise}
        href="/"
        className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.24em] text-label transition-colors hover:text-gold-accent focus-visible:outline-2 focus-visible:outline-gold-accent"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        labodega-ve.com
      </motion.a>
    </motion.footer>
  );
}

/** Fondo y contenedor de la carta, también para el aviso de "no disponible". */
export function MenuShell({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div aria-hidden="true" className="pop-page-base" />
      <div aria-hidden="true" className="pop-page-glow pop-page-glow--warm" />
      <main className="pedidos-root relative z-[1] mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col px-4 pb-16 md:px-8">
        {children}
      </main>
    </MotionConfig>
  );
}

/** El backend no respondió: no es lo mismo que un menú que no existe. */
export function MenuUnavailable() {
  return (
    <MenuShell>
      <p role="alert" className="py-24 text-center font-serif text-[22px] italic text-coral">
        No pudimos cargar el menú. Revisa tu conexión e intenta de nuevo en unos minutos.
      </p>
    </MenuShell>
  );
}
