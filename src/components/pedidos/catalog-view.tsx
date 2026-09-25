"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import type { Category, Product } from "@/lib/pedidos-api";
import type { CartItem } from "./use-cart";
import { ProductCard } from "./product-card";

const ALL = "todos";

function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function CatalogView({
  categories,
  products,
  cart,
  loading,
  onSelect,
}: {
  categories: Category[];
  products: Product[];
  cart: CartItem[];
  loading: boolean;
  onSelect: (product: Product) => void;
}) {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return products.filter(
      (p) =>
        (category === ALL || p.categoryId === category) &&
        (!q || normalize(`${p.name} ${p.description}`).includes(q)),
    );
  }, [products, category, query]);

  const qtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
    return map;
  }, [cart]);

  const tabs = [{ id: ALL, name: "Todos" }, ...categories];

  return (
    <>
      {/* Header sticky: marca, buscador y categorías. */}
      <header className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-hair-div bg-[rgba(11,9,6,0.86)] px-4 pt-4 pb-3 md:-mx-8 md:px-8 md:pt-6 backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <span className="font-serif text-[26px] font-semibold leading-none tracking-tight text-cream">
            La Bodega
          </span>
          <span className="pl-[0.1em] text-[10.5px] font-medium uppercase tracking-[0.28em] text-label">
            Pedidos · Delivery y retiro
          </span>
        </div>

        <label className="relative block md:max-w-[520px]">
          <span className="sr-only">Buscar productos</span>
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

        <nav
          aria-label="Categorías"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-on={category === tab.id}
              aria-pressed={category === tab.id}
              onClick={() => setCategory(tab.id)}
              className="pop-chip shrink-0 px-[18px] py-[9px] text-[15px] font-medium whitespace-nowrap"
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </header>

      <section aria-label="Productos" className="grid grid-cols-1 gap-3 pt-4 md:grid-cols-2 md:gap-4 md:pt-6 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-[134px] animate-pulse rounded-[22px] bg-[rgba(247,242,231,0.05)]" />
          ))
        ) : visible.length === 0 ? (
          <p className="col-span-full py-16 text-center text-[17px] text-muted-ink">
            No encontramos productos{query ? ` para “${query}”` : ""}. Prueba con otra búsqueda.
          </p>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                layout
                className="w-full"
              >
                <ProductCard
                  product={product}
                  inCart={qtyByProduct.get(product.id) ?? 0}
                  onSelect={() => onSelect(product)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>
    </>
  );
}
