import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Libro de Sala",
  description:
    "Panel de satisfacción de La Bodega — KPIs, tendencias y seguimiento de quejas.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
