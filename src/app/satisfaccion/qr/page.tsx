import type { Metadata } from "next";
import { QrPoster } from "@/components/satisfaccion/qr-poster";

export const metadata: Metadata = {
  title: "Código QR",
  description: "Cartel imprimible con el código QR de la encuesta de La Bodega.",
  robots: { index: false, follow: false },
};

export default function QrPage() {
  return <QrPoster />;
}
