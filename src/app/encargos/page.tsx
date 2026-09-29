import type { Metadata } from "next";
import { EncargosExperience } from "@/components/encargos/encargos-experience";

export const metadata: Metadata = {
  title: "Haz tu encargo",
  description:
    "Encarga tortas y pedidos de La Bodega para la fecha que elijas. Un asesor te confirma el precio por WhatsApp.",
};

export default function EncargosPage() {
  return <EncargosExperience />;
}
