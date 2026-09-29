import type { Metadata } from "next";
import { EncargoTracking } from "@/components/encargos/encargo-tracking";

// El link es privado (lleva nombre y dirección del cliente): no se indexa.
export const metadata: Metadata = {
  title: "Tu encargo",
  robots: { index: false, follow: false },
};

export default async function EncargoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <EncargoTracking token={token} />;
}
