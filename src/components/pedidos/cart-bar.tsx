"use client";

import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { springSoft } from "@/components/satisfaccion/motion";
import { formatUsd } from "./format";

/** Barra flotante inferior del catálogo con el resumen del carrito. */
export function CartBar({
  count,
  subtotal,
  onOpen,
}: {
  count: number;
  subtotal: number;
  onOpen: () => void;
}) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={springSoft}
          className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={onOpen}
            className="lb-shine pop-btn-gold flex w-full max-w-[560px] items-center gap-3 rounded-full px-5 py-4 text-left shadow-[0_14px_40px_-12px_rgba(217,169,74,0.75)]"
          >
            <span className="relative inline-flex">
              <ShoppingBag size={22} />
              <motion.span
                key={count}
                initial={{ scale: 1.6 }}
                animate={{ scale: 1 }}
                transition={springSoft}
                className="absolute -top-2 -right-2.5 inline-flex min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[12px] font-semibold text-gold-hi"
              >
                {count}
              </motion.span>
            </span>
            <span className="flex-1 pl-2 text-[16px] font-semibold uppercase tracking-[0.1em]">Ver pedido</span>
            <span className="text-[18px] font-semibold">{formatUsd(subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
