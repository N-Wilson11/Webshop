"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Product } from "@/lib/api";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
  cartAnimation: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cookie-shop-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(0);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        setItems([]);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(product: Product, quantity = 1) {
    setCartAnimation((animation) => animation + 1);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, stock: product.stock, quantity: Math.min(i.quantity + quantity, product.stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: Math.min(quantity, product.stock)
        }
      ];
    });
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const stock = Number.isInteger(item.stock) ? item.stock : quantity;
        return { ...item, quantity: Math.min(quantity, stock) };
      })
    );
  }

  function clear() {
    setItems([]);
  }

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        totalItems,
        totalPrice,
        cartAnimation
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
