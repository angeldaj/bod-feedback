"use client";

import { motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { Photo } from "@/components/landing/photo";
import type { Product } from "@/lib/pedidos-api";
import { formatUsd } from "./format";
import type { Flow } from "./shared";

export function ProductCard({
  product,
  inCart,
  onSelect,
  flow = "pedido",
}: {
  product: Product;
  /** Unidades de este producto ya en el carrito. */
  inCart: number;
  onSelect: () => void;
  flow?: Flow;
}) {
  const reduce = useReducedMotion();
  // En un encargo el agotado de hoy no importa: se prepara para la fecha.
  const blocked = product.soldOut && flow === "pedido";
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={blocked}
      aria-label={blocked ? `${product.name}, agotado` : undefined}
      whileTap={reduce || blocked ? undefined : { scale: 0.98 }}
      className="group flex w-full items-stretch gap-4 rounded-[22px] border border-hair-div bg-[rgba(247,242,231,0.035)] p-3 text-left transition-colors hover:border-hair-chip disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-hair-div"
    >
      <span className="relative aspect-square w-[108px] shrink-0 overflow-hidden rounded-[16px]">
        <Photo id={product.image} alt={product.name} w={320} h={320} sizes="108px" />
        {inCart > 0 && (
          <span className="absolute top-2 left-2 z-[1] inline-flex min-w-7 items-center justify-center rounded-full bg-gold px-2 py-0.5 text-[13px] font-semibold text-ink">
            {inCart}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 py-1">
        <span className="text-[19px] font-semibold uppercase leading-tight tracking-[0.02em] text-cream">
          {product.name}
        </span>
        <span className="line-clamp-2 text-[15px] leading-snug text-muted-ink">{product.description}</span>
        <span className="mt-auto flex items-center justify-between pt-2">
          <span className="flex flex-col">
            <span className="font-serif text-[22px] font-semibold text-gold-accent">{formatUsd(product.price)}</span>
            {flow === "encargo" && <span className="text-[12px] uppercase tracking-[0.12em] text-label">Precio referencial</span>}
          </span>
          {blocked ? (
            <span className="rounded-full border border-hair-div px-4 py-2 text-[14px] font-semibold text-muted-ink">Agotado</span>
          ) : (
            <span className="pop-btn-gold inline-flex items-center gap-1 rounded-full px-4 py-2 text-[14px] font-semibold">
              <Plus size={16} strokeWidth={2.6} />
              Agregar
            </span>
          )}
        </span>
      </span>
    </motion.button>
  );
}
