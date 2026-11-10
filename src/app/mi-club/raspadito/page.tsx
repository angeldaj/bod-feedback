import type { Metadata } from "next";
import { RaspaditoScreen } from "@/components/mi-club/screens/raspadito-screen";

export const metadata: Metadata = {
  title: "Raspadito de Navidad | Mi Club",
  description: "Activa el código de tu ticket del pan de jamón: el premio va a tu Wallet y, si no salió, ganas una tirada de ruleta.",
};

export default function Page() {
  return <RaspaditoScreen />;
}
