import type { Metadata } from "next";
import { PedidosExperience } from "@/components/pedidos/pedidos-experience";

export const metadata: Metadata = {
  title: "Haz tu pedido",
  description:
    "Arma tu pedido de La Bodega, elige delivery o retiro en local y envíalo por WhatsApp con tu pago móvil.",
};

export default function PedidosPage() {
  return <PedidosExperience />;
}
