import type { Metadata } from "next";
import { WalletScreen } from "@/components/mi-club/screens/wallet-screen";

export const metadata: Metadata = {
  title: "Bodega Wallet | Mi Club",
  description: "Tus vouchers de Bodega Club: canjes con puntos y regalos de la casa, listos para usar en caja.",
};

export default function Page() {
  return <WalletScreen />;
}
