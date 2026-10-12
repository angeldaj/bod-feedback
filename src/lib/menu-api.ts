// La Bodega — carta pública de cada local (la-bodega-api spec 089,
// `GET /storefront/menus/:slug`). Único punto de contacto con el backend de
// los menús: si cambia el endpoint, se toca solo este archivo.
//
// El precio de cada producto sale de la lista de MarSoft del menú y el
// backend lo mantiene al día cada hora; aquí solo se muestra.

import { PedidosApiError } from "@/lib/pedidos-api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://app.bod-service.cloud/api";

/** Los precios se refrescan cada hora en el backend; 5 minutos de caché alcanzan. */
const REVALIDATE_SECONDS = 300;

export type MenuSection = { id: string; name: string };

export type MenuItem = {
  id: string;
  sectionId: string;
  name: string;
  /** Vacío si no tiene. */
  description: string;
  /** Precio en USD con IVA (el backend lo suma; MarSoft lo guarda sin IVA). */
  price: number;
};

export type Menu = {
  name: string;
  slug: string;
  sections: MenuSection[];
  items: MenuItem[];
  /** Bs por 1 USD; null si no hay tasa publicada. */
  rate: number | null;
};

type ApiMenu = Omit<Menu, "items"> & {
  items: { id: string; sectionId: string; name: string; description: string; priceUsd: number }[];
};

/** Minúsculas, números y guiones (igual que el backend): cualquier otra cosa es 404 sin preguntar. */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * Carta de un menú, o `null` si no existe o está apagado. Una caída del
 * backend lanza `PedidosApiError` para no confundirla con "no existe".
 */
export async function fetchMenu(slug: string): Promise<Menu | null> {
  const clean = slug.trim().toLowerCase();
  if (!SLUG_PATTERN.test(clean)) return null;

  const response = await fetch(`${API_BASE_URL}/storefront/menus/${clean}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new PedidosApiError(`Error ${response.status}`, response.status);
  }
  const menu = (await response.json()) as ApiMenu;
  return {
    name: menu.name,
    slug: menu.slug,
    sections: menu.sections,
    items: menu.items.map((item) => ({
      id: item.id,
      sectionId: item.sectionId,
      name: item.name,
      description: item.description,
      price: item.priceUsd,
    })),
    rate: menu.rate,
  };
}
