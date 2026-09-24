"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Photo } from "@/components/landing/photo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandTextArea } from "@/components/satisfaccion/brand-field";
import { formatUsd } from "./format";
import { QtyStepper } from "./shared";

export type DialogTarget = {
  name: string;
  description: string;
  price: number;
  image: string;
  quantity: number;
  note: string;
  /** Edición de una línea existente del carrito. */
  editing: boolean;
};

export function ProductDialog({
  target,
  onClose,
  onConfirm,
}: {
  target: DialogTarget | null;
  onClose: () => void;
  onConfirm: (quantity: number, note: string) => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-[#090604]/70 backdrop-blur-sm"
        className="pedidos-scroll top-auto bottom-0 left-0 flex max-h-[92dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-t-[28px] rounded-b-none border border-hair-div bg-[#120e0a] p-0 text-cream ring-0 data-open:slide-in-from-bottom-10 data-open:zoom-in-100 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
      >
        {/* key: reinicia cantidad/nota cada vez que se abre con otro producto. */}
        {target && <DialogBody key={`${target.name}-${target.editing}`} target={target} onConfirm={onConfirm} />}
      </DialogContent>
    </Dialog>
  );
}

function DialogBody({
  target,
  onConfirm,
}: {
  target: DialogTarget;
  onConfirm: (quantity: number, note: string) => void;
}) {
  const [quantity, setQuantity] = useState(target.quantity);
  const [note, setNote] = useState(target.note);

  return (
    <>
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden max-[700px]:[@media(max-height:760px)]:aspect-[16/8]">
        <Photo id={target.image} alt={target.name} w={900} h={560} sizes="(max-width: 640px) 100vw, 448px" />
        <DialogClose
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-[1] inline-flex size-10 items-center justify-center rounded-full bg-[rgba(11,9,6,0.72)] text-cream backdrop-blur-md transition-colors hover:text-gold"
        >
          <X size={20} />
        </DialogClose>
      </div>
      <div className="flex shrink-0 flex-col gap-5 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-2">
          <DialogTitle className="text-[28px] font-semibold uppercase leading-none tracking-[0.02em] text-cream">
            {target.name}
          </DialogTitle>
          <DialogDescription className="text-[16px] leading-snug text-body">{target.description}</DialogDescription>
          <span className="font-serif text-[24px] font-semibold text-gold-accent">{formatUsd(target.price)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-label">Cantidad</span>
          <QtyStepper value={quantity} onChange={setQuantity} />
        </div>

        <BrandTextArea
          label="Indicaciones (opcional)"
          value={note}
          onChange={setNote}
          placeholder="Ej.: sin cebolla, bien tostado…"
          rows={2}
        />

        <Button variant="pop" size="popLg" className="w-full" onClick={() => onConfirm(quantity, note)}>
          {target.editing ? "Guardar cambios" : "Agregar"} · {formatUsd(target.price * quantity)}
        </Button>
      </div>
    </>
  );
}
