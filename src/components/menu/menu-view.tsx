"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Search, X } from "lucide-react";
import { formatBs, formatUsd } from "@/components/pedidos/format";
import type { Menu, MenuItem } from "@/lib/menu-api";

const ALL = "todos";

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Carta de un local (`/menu/<slug>`): solo para ver, sin carrito. Mismo
 * lenguaje que `/pedidos` (header pegajoso, buscador y pestañas), sin fotos.
 */
export function MenuView({ menu }: { menu: Menu }) {
  const [section, setSection] = useState(ALL);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return menu.items.filter(
      (item) =>
        (section === ALL || item.sectionId === section) &&
        (!q || normalize(`${item.name} ${item.description}`).includes(q)),
    );
  }, [menu.items, section, query]);

  // Con "Todos" y sin búsqueda, la carta va agrupada por sección.
  const grouped = section === ALL && !query.trim();
  const tabs = [{ id: ALL, name: "Todos" }, ...menu.sections];

  return (
    <MenuShell>
      <header className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-hair-div bg-[rgba(11,9,6,0.86)] px-4 pt-4 pb-3 backdrop-blur-md md:-mx-8 md:px-8 md:pt-6">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-serif text-[26px] font-semibold leading-none tracking-tight text-cream">La Bodega</span>
            <span className="pl-[0.1em] text-[10.5px] font-medium uppercase tracking-[0.28em] text-label">Menú · {menu.name}</span>
          </div>
          {menu.rate !== null && (
            <span className="text-right text-[12px] leading-tight text-label">
              Tasa BCV
              <span className="block font-medium text-muted-ink">{formatBs(menu.rate)}</span>
            </span>
          )}
        </div>

        <label className="relative block md:max-w-[520px]">
          <span className="sr-only">Buscar en el menú</span>
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-label" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un producto…"
            className="pop-input w-full py-3 pr-11 pl-11 text-[17px] placeholder:text-placeholder [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-label hover:text-cream"
            >
              <X size={18} />
            </button>
          )}
        </label>

        {menu.sections.length > 1 && (
          <nav
            aria-label="Secciones"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-on={section === tab.id}
                aria-pressed={section === tab.id}
                onClick={() => setSection(tab.id)}
                className="pop-chip shrink-0 px-[18px] py-[9px] text-[15px] font-medium whitespace-nowrap"
              >
                {tab.name}
              </button>
            ))}
          </nav>
        )}
      </header>

      {menu.items.length === 0 ? (
        <p className="py-24 text-center text-[17px] text-muted-ink">Estamos preparando este menú. Vuelve pronto.</p>
      ) : visible.length === 0 ? (
        <p className="py-16 text-center text-[17px] text-muted-ink">
          No encontramos productos{query ? ` para “${query}”` : ""}. Prueba con otra búsqueda.
        </p>
      ) : grouped ? (
        <div className="flex flex-col gap-8 pt-6">
          {menu.sections.map((group) => {
            const items = visible.filter((item) => item.sectionId === group.id);
            if (items.length === 0) return null;
            return (
              <section key={group.id} aria-labelledby={`seccion-${group.id}`}>
                <h2
                  id={`seccion-${group.id}`}
                  className="mb-3 font-serif text-[24px] font-semibold tracking-tight text-cream"
                >
                  {group.name}
                </h2>
                <ItemList items={items} rate={menu.rate} />
              </section>
            );
          })}
        </div>
      ) : (
        <div className="pt-4 md:pt-6">
          <ItemList items={visible} rate={menu.rate} />
        </div>
      )}

      <p className="mt-auto pt-12 text-center text-[13px] text-label">
        Precios en dólares{menu.rate !== null ? ", en bolívares a la tasa BCV del día" : ""}. Sujetos a disponibilidad.
      </p>
    </MenuShell>
  );
}

function ItemList({ items, rate }: { items: MenuItem[]; rate: number | null }) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start justify-between gap-4 rounded-[22px] border border-hair-div bg-[rgba(247,242,231,0.035)] px-4 py-3.5"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-[18px] font-semibold uppercase leading-tight tracking-[0.02em] text-cream">{item.name}</span>
              {item.description && <span className="text-[15px] leading-snug text-muted-ink">{item.description}</span>}
            </span>
            <span className="flex shrink-0 flex-col items-end">
              <span className="font-serif text-[22px] font-semibold leading-tight text-gold-accent">{formatUsd(item.price)}</span>
              {rate !== null && <span className="text-[13px] text-label">{formatBs(item.price * rate)}</span>}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
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
      <p role="alert" className="py-24 text-center text-[17px] text-coral">
        No pudimos cargar el menú. Revisa tu conexión e intenta de nuevo en unos minutos.
      </p>
    </MenuShell>
  );
}
