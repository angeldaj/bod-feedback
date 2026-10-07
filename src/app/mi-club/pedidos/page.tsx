import type { Metadata } from "next";
import { PedidosScreen } from "@/components/mi-club/screens/pedidos-screen";

export const metadata: Metadata = {
  title: "Pedidos | Mi Club",
  description: "Sigue tus pedidos online con Bodega Club: estado, notas al chef, ruta hasta tu casa y puntos por calificar.",
};

export default function Page() {
  return <PedidosScreen />;
}
