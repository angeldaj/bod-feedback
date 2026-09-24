"use client";

import { useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Handshake,
  MessageCircle,
  Receipt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Copy aprobado (spec feedback v2). Los emojis de la spec se pintan como
// iconos de lucide para mantener un solo lenguaje de iconos en la UI.
const POLICIES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Camera,
    title: "Una foto vale más que mil explicaciones.",
    body: "Nos permite entender qué pasó sin hacerte preguntas y protege a nuestros clientes de reclamos que no son reales.",
  },
  {
    icon: UtensilsCrossed,
    title: "Si tu pedido no estuvo bien, te lo cambiamos.",
    body: "Con gusto, siempre que quede más de la mitad del plato. Así vemos qué falló y cuidamos que no se repita.",
  },
  {
    icon: CalendarDays,
    title: "Los cambios son el mismo día.",
    body: "Si todavía estás en el local, avísale también a alguien del equipo: lo resolvemos en el momento.",
  },
  {
    icon: Receipt,
    title: "¿Es un cobro?",
    body: "Ten a mano tu factura o la referencia del pago para revisarlo enseguida.",
  },
  {
    icon: MessageCircle,
    title: "Tu WhatsApp es solo para responderte.",
    body: "No lo usamos para publicidad.",
  },
];

/**
 * "Así resolvemos tu queja": expandido la primera vez, colapsable y reabrible
 * desde cualquier paso. El estado lo lleva la queja (se colapsa también al
 * elegir sucursal).
 */
export function PoliciesBox({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reduce = useReducedMotion();
  const panelId = useId();

  return (
    <div className="pop-policies mb-6" data-open={open}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
        className="pop-policies__toggle"
      >
        <span className="pop-policies__badge" aria-hidden="true">
          <Handshake size={18} strokeWidth={2.1} />
        </span>
        <span className="flex-1 text-left text-[16px] font-semibold uppercase tracking-[0.04em] text-cream">
          Así resolvemos tu queja
        </span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }}
          className="grid place-items-center text-muted-ink"
          aria-hidden="true"
        >
          <ChevronRight size={20} strokeWidth={2.4} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-4 pt-1 pb-4 min-[560px]:px-5">
              <p className="text-[15.5px] leading-[1.55] text-body">
                En La Bodega queremos superar siempre tus expectativas. Por eso, nuestro principal
                compromiso es que salgas de aquí feliz y con ganas de volver. Estas pautas nos
                ayudan a resolverlo rápido y justo para todos:
              </p>
              <ul className="flex flex-col gap-3.5">
                {POLICIES.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="pop-policies__icon" aria-hidden="true">
                      <Icon size={16} strokeWidth={2.1} />
                    </span>
                    <p className="text-[15px] leading-[1.5] text-body">
                      <strong className="font-semibold text-cream">{title}</strong> {body}
                    </p>
                  </li>
                ))}
              </ul>
              <div>
                <Button variant="popGhost" size="popSm" onClick={() => onOpenChange(false)} className="min-h-11">
                  Entendido, seguir
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
