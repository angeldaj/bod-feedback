import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuUnavailable, MenuView } from "@/components/menu/menu-view";
import { fetchMenu, type Menu } from "@/lib/menu-api";

// La misma carta sirve para el título y la página: una sola consulta.
const getMenu = cache(fetchMenu);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(slug).catch(() => null);
  if (!menu) return { title: "Menú" };
  return {
    title: `Menú · ${menu.name}`,
    description: `La carta de La Bodega ${menu.name}, con precios en dólares y bolívares.`,
  };
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params;
  let menu: Menu | null;
  try {
    menu = await getMenu(slug);
  } catch {
    return <MenuUnavailable />;
  }
  if (!menu) notFound();
  return <MenuView menu={menu} />;
}
