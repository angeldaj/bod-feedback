import type { Metadata } from "next";
import { HomeScreen } from "@/components/mi-club/screens/home-screen";

export const metadata: Metadata = {
  title: "Mi Club | Área de socios de Bodega Club",
  description: "Tu tarjeta de socio de Bodega Club: puntos, nivel, diseño de tarjeta y tu Wallet de vouchers.",
};

export default function MiClubHomePage() {
  return <HomeScreen />;
}
