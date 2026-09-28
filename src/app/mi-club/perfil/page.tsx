import type { Metadata } from "next";
import { PerfilScreen } from "@/components/mi-club/screens/perfil-screen";

export const metadata: Metadata = {
  title: "Perfil | Mi Club",
  description: "Datos de tu cuenta, diseño de tarjeta y notificaciones de Bodega Club.",
};

export default function Page() {
  return <PerfilScreen />;
}
