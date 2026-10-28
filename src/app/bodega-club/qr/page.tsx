import type { Metadata } from "next";
import { ClubQrPoster } from "@/components/bodega-club/club-qr-poster";

export const metadata: Metadata = {
  title: "QR Bodega Club",
  description: "Flyer y talón imprimibles con el código QR de Bodega Club.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ClubQrPoster />;
}
