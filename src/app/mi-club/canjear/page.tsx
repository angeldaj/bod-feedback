import type { Metadata } from "next";
import { CanjearScreen } from "@/components/mi-club/screens/canjear-screen";

export const metadata: Metadata = {
  title: "Canjear | Mi Club",
  description: "Cambia tus puntos de Bodega Club por desayunos, panadería, postres y más.",
};

export default function Page() {
  return <CanjearScreen />;
}
