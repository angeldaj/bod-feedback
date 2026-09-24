"use client";

import { AnimatePresence, motion } from "motion/react";
import { Pencil, ShoppingBag, Trash2 } from "lucide-react";
import { Photo } from "@/components/landing/photo";
import { Button } from "@/components/ui/button";
import type { CartItem } from "./use-cart";
import { formatUsd } from "./format";
import { cls, QtyStepper, StepHeader } from "./shared";

export function CartView({
  items,
  subtotal,
  unavailable,
  onBack,
  onEdit,
  onQuantity,
  onRemove,
  onContinue,
}: {
  items: CartItem[];
  subtotal: number;
  /** productId de lo que se agotó o salió de la tienda desde que se agregó. */
  unavailable: ReadonlySet<string>;
  onBack: () => void;
  onEdit: (item: CartItem) => void;
  onQuantity: (item: CartItem, quantity: number) => void;
  onRemove: (item: CartItem) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <StepHeader eyebrow="Paso 1 de 3" title="Tu pedido" onBack={onBack} />

      {items.length === 0 ? (
        <div className={`${cls.panel} flex flex-col items-center gap-4 px-6 py-12 text-center`}>
          <ShoppingBag size={36} className="text-label" />
          <p className="text-[17px] text-body">Tu carrito está vacío. Agrega algo del catálogo.</p>
          <Button variant="popGhost" size="popMd" onClick={onBack}>
            Ver catálogo
          </Button>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.lineId}
                  layout
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`${cls.panel} flex gap-3 p-3`}
                >
                  <span className="relative size-[76px] shrink-0 overflow-hidden rounded-[14px]">
                    <Photo id={item.image} alt={item.name} w={200} h={200} sizes="76px" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[17px] font-semibold uppercase leading-tight tracking-[0.02em] text-cream">
                        {item.name}
                      </span>
                      <span className="font-serif text-[19px] font-semibold text-gold-accent">
                        {formatUsd(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.note && <p className="text-[14px] leading-snug text-muted-ink">“{item.note}”</p>}
                    {unavailable.has(item.productId) && (
                      <p role="alert" className={cls.error}>
                        Se agotó. Quítalo para continuar.
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <QtyStepper size="sm" value={item.quantity} onChange={(q) => onQuantity(item, q)} />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => onEdit(item)}
                          className="inline-flex size-9 items-center justify-center rounded-full text-label transition-colors hover:text-cream"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Quitar ${item.name}`}
                          onClick={() => onRemove(item)}
                          className="inline-flex size-9 items-center justify-center rounded-full text-label transition-colors hover:text-coral"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="flex items-center justify-between border-t border-hair-div pt-4">
            <span className={cls.label}>Subtotal</span>
            <span className="font-serif text-[28px] font-semibold text-cream">{formatUsd(subtotal)}</span>
          </div>

          <Button
            variant="pop"
            size="popLg"
            className="w-full md:ml-auto md:w-[360px]"
            onClick={onContinue}
            disabled={items.some((item) => unavailable.has(item.productId))}
          >
            Continuar
          </Button>
        </>
      )}
    </div>
  );
}
