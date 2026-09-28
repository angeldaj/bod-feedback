import type { Metadata } from "next";
import { MiClubShell } from "@/components/mi-club/shell";

export const metadata: Metadata = {
  title: "Demo de Bodega Club",
  description: "Demostración del área de socios de Bodega Club con una socia de ejemplo.",
  robots: { index: false, follow: false },
};

/** Demo con datos de ejemplo: las mismas pantallas de /mi-club, sin login. */
export default function ClubMockLayout({ children }: LayoutProps<"/club-mock">) {
  return (
    <MiClubShell mode="demo" basePath="/club-mock">
      {children}
    </MiClubShell>
  );
}
