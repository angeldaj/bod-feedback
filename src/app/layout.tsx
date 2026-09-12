import type { Metadata } from "next";
import { Barlow_Condensed, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://labodega.example"),
  title: {
    default: "La Bodega · Restaurante · Panadería",
    template: "%s · La Bodega",
  },
  description:
    "La Bodega — restaurante y panadería en Puerto Ordaz, Venezuela.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="relative min-h-dvh">
        <div className="lb-grain" aria-hidden="true" />
        <div className="lb-ember" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
