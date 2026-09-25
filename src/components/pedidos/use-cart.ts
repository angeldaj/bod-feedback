"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { Product } from "@/lib/pedidos-api";

export type CartItem = {
  /** Único por línea: el mismo producto con notas distintas son dos líneas. */
  lineId: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  note: string;
};

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; product: Product; quantity: number; note: string }
  | { type: "update"; lineId: string; quantity: number; note: string }
  | { type: "remove"; lineId: string }
  | { type: "sync"; products: readonly Product[] }
  | { type: "clear" };

const STORAGE_KEY = "labodega-pedido";
export const MAX_QTY = 20;

type CartState = {
  items: CartItem[];
  /** Ya se leyó el carrito de localStorage. */
  loaded: boolean;
};

function itemsReducer(items: CartItem[], action: Exclude<Action, { type: "hydrate" }>): CartItem[] {
  switch (action.type) {
    case "add": {
      const note = action.note.trim();
      // Mismo producto y misma nota: se suma a la línea existente.
      const existing = items.find((i) => i.productId === action.product.id && i.note === note);
      if (existing) {
        return items.map((i) =>
          i === existing ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + action.quantity) } : i,
        );
      }
      const { id, name, price, image } = action.product;
      return [
        ...items,
        { lineId: `${id}-${Date.now()}`, productId: id, name, price, image, quantity: action.quantity, note },
      ];
    }
    case "update":
      return items.map((i) =>
        i.lineId === action.lineId ? { ...i, quantity: action.quantity, note: action.note.trim() } : i,
      );
    case "remove":
      return items.filter((i) => i.lineId !== action.lineId);
    case "sync": {
      // Precio, nombre y foto vigentes: el cliente paga antes de confirmar, así que
      // el total que ve no puede salir de un precio guardado hace días.
      const current = new Map(action.products.map((p) => [p.id, p]));
      let changed = false;
      const next = items.map((i) => {
        const p = current.get(i.productId);
        if (!p || (p.price === i.price && p.name === i.name && p.image === i.image)) return i;
        changed = true;
        return { ...i, price: p.price, name: p.name, image: p.image };
      });
      return changed ? next : items;
    }
    case "clear":
      return [];
  }
}

function reducer(state: CartState, action: Action): CartState {
  if (action.type === "hydrate") return { items: action.items, loaded: true };
  return { ...state, items: itemsReducer(state.items, action) };
}

/**
 * Un solo carrito: el catálogo es el mismo en todos los locales (solo cambia qué
 * está agotado en cada uno), así que cambiar de local no lo vacía.
 */
export function useCart() {
  const [{ items, loaded }, dispatch] = useReducer(reducer, { items: [], loaded: false });

  // Se lee de localStorage tras montar, para no desalinear la hidratación.
  useEffect(() => {
    let saved: CartItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as CartItem[];
    } catch {
      // Sin almacenamiento el carrito funciona igual, solo no persiste.
    }
    dispatch({ type: "hydrate", items: saved });
  }, []);

  // Solo se escribe después de leer, para no pisar el carrito guardado con uno vacío.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Persistencia opcional.
    }
  }, [items, loaded]);

  const add = useCallback(
    (product: Product, quantity: number, note: string) => dispatch({ type: "add", product, quantity, note }),
    [],
  );
  const update = useCallback(
    (lineId: string, quantity: number, note: string) => dispatch({ type: "update", lineId, quantity, note }),
    [],
  );
  const remove = useCallback((lineId: string) => dispatch({ type: "remove", lineId }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const sync = useCallback((products: readonly Product[]) => dispatch({ type: "sync", products }), []);

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    [items],
  );

  return { items, count, subtotal, add, update, remove, clear, sync };
}
