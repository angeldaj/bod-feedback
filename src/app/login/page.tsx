import type { Metadata } from "next";
import { LoginExperience } from "@/components/auth/login-experience";

export const metadata: Metadata = {
  title: "Iniciar sesión | Bodega Club",
  description:
    "Entra al área de socios de Bodega Club para ver tus puntos, recompensas y actividad en La Bodega.",
};

export default function LoginPage() {
  return <LoginExperience />;
}
