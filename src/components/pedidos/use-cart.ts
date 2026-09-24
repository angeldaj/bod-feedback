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
  | { type: "hydrate"; items: CartItem[]; storeId: string | null }
  | { type: "add"; product: Product; quantity: number; note: string }
  | { type: "update"; lineId: string; quantity: number; note: string }
  | { type: "remove"; lineId: string }
  | { type: "sync"; products: readonly Product[] }
  | { type: "clear" };

const STORAGE_KEY = "labodega-pedido";
export const MAX_QTY = 20;

type CartState = {
  items: CartItem[];
  /** Local cuyo carrito se leyó de localStorage; null mientras no se lee. */
  loadedFor: string | null;
};

/** Un carrito por local: un pedido sale de un solo local. */
const storageKey = (storeId: string) => `${STORAGE_KEY}:${storeId}`;

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
  if (action.type === "hydrate") return { items: action.items, loadedFor: action.storeId };
  return { ...state, items: itemsReducer(state.items, action) };
}

export function useCart(storeId: string | null) {
  const [{ items, loadedFor }, dispatch] = useReducer(reducer, { items: [], loadedFor: null });

  // El carrito del local se lee de localStorage tras montar (para no desalinear la
  // hidratación) y cada vez que cambia el local.
  useEffect(() => {
    if (!storeId) return;
    let saved: CartItem[] = [];
    try {
      const raw = localStorage.getItem(storageKey(storeId));
      if (raw) saved = JSON.parse(raw) as CartItem[];
    } catch {
      // Sin almacenamiento el carrito funciona igual, solo no persiste.
    }
    dispatch({ type: "hydrate", items: saved, storeId });
  }, [storeId]);

  // Solo se escribe después de leer el mismo local, para no pisar un carrito con otro.
  useEffect(() => {
    if (!storeId || loadedFor !== storeId) return;
    try {
      localStorage.setItem(storageKey(storeId), JSON.stringify(items));
    } catch {
      // Persistencia opcional.
    }
  }, [items, loadedFor, storeId]);

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
