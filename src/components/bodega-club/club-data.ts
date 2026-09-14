import {
  CakeSlice,
  Coffee,
  Gift,
  PackageCheck,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";

export type Reward = {
  points: number;
  name: string;
  note: string;
  Icon: LucideIcon;
};

export type Benefit = {
  title: string;
  description: string;
  Icon: LucideIcon;
  tone: "coral" | "gold" | "photo";
  /** Unsplash id, only for `photo` cards. */
  image?: string;
  imageAlt?: string;
};

export const REWARDS: Reward[] = [
  { points: 20, name: "Café de la casa", note: "El de siempre, por la casa.", Icon: Coffee },
  { points: 35, name: "Pan o dulce", note: "Elige una pieza participante.", Icon: Wheat },
  { points: 60, name: "Postre del día", note: "Una pausa dulce para volver.", Icon: CakeSlice },
  { points: 100, name: "Desayuno", note: "Una selección completa del menú.", Icon: UtensilsCrossed },
  { points: 180, name: "Premio especial", note: "Tortas, experiencias o crédito.", Icon: Gift },
];

export const BENEFITS: Benefit[] = [
  {
    title: "Tu semana de cumpleaños",
    description: "Un detalle especial y puntos extra para celebrarlo a tu manera.",
    Icon: CakeSlice,
    tone: "coral",
  },
  {
    title: "Delivery participante",
    description: "Sin costo desde el monto y dentro de las zonas participantes.",
    Icon: Truck,
    tone: "photo",
    image: "1517248135467-4c7edcad34c4",
    imageAlt: "Mesa servida de La Bodega lista para llevar",
  },
  {
    title: "Días de puntos dobles",
    description: "Algunas visitas suman el doble. Te avisamos por WhatsApp.",
    Icon: Sparkles,
    tone: "gold",
  },
  {
    title: "Sabores para miembros",
    description: "Combos, lanzamientos y productos reservados para el club.",
    Icon: PackageCheck,
    tone: "photo",
    image: "1546069901-ba9599a7e63c",
    imageAlt: "Plato de la casa reservado para miembros del club",
  },
];

export const FAQS = [
  {
    question: "¿Registrarse tiene costo?",
    answer: "No. Bodega Club es gratuito y puedes salir cuando quieras.",
  },
  {
    question: "¿Dónde acumulo puntos?",
    answer:
      "En las sucursales de La Bodega, el restaurante, la panadería, pedidos para llevar y delivery participante.",
  },
  {
    question: "¿Cómo identifico mis compras?",
    answer:
      "Indica el WhatsApp asociado a tu cuenta al pagar. Más adelante también podrás usar tu código personal.",
  },
  {
    question: "¿Cómo canjeo una recompensa?",
    answer:
      "Elige una recompensa disponible y solicítala antes de pagar. Los puntos se descuentan después de confirmar el canje.",
  },
  {
    question: "¿Cómo funciona mi regalo de cumpleaños?",
    answer:
      "Si agregas tu fecha de cumpleaños, recibirás el beneficio disponible durante esa semana.",
  },
  {
    question: "¿Qué hacen con mis datos?",
    answer:
      "Usamos tus datos para administrar la membresía. Las promociones por WhatsApp requieren un permiso separado y opcional.",
  },
] as const;

export const PREFERENCES = ["Panadería", "Desayunos", "Almuerzos", "Café", "Postres"] as const;
export const BRANCHES = ["Bodega 1", "Bodega 2", "Bodega 3"] as const;

