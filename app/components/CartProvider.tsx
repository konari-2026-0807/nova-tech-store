"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { CatalogProduct } from "../../lib/catalog";

export type CartItem = {
  key: string;
  slug: string;
  name: string;
  category: string;
  priceNumber: number;
  image: string;
  color: string;
  option: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (product: CatalogProduct, color?: string, option?: string, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "nova-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved) as CartItem[]);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.priceNumber * item.quantity, 0),
    hydrated,
    addItem(product, color = product.colors[0], option = product.options[0], quantity = 1) {
      const key = `${product.slug}::${color}::${option}`;
      setItems((current) => {
        const existing = current.find((item) => item.key === key);
        if (existing) return current.map((item) => item.key === key ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item);
        return [...current, { key, slug: product.slug, name: product.name, category: product.category, priceNumber: product.priceNumber, image: product.image, color, option, quantity: Math.min(10, Math.max(1, quantity)) }];
      });
    },
    updateQuantity(key, quantity) {
      if (quantity < 1) {
        setItems((current) => current.filter((item) => item.key !== key));
        return;
      }
      setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.min(10, quantity) } : item));
    },
    removeItem(key) {
      setItems((current) => current.filter((item) => item.key !== key));
    },
    clearCart() {
      setItems([]);
    },
  }), [hydrated, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}

export function openCartDrawer() {
  window.dispatchEvent(new Event("nova:open-cart"));
}
