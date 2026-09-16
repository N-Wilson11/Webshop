"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/api";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="text-center">
        <p className="text-lg text-ink/70">Your cart is empty.</p>
        <Link href="/" className="mt-4 inline-block text-primary underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Your Cart</h1>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary/20">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🍪</div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ink">{item.name}</p>
              <p className="text-sm text-ink/60">{formatPrice(item.price, item.currency)} each</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
              className="w-16 rounded-lg border border-black/10 px-2 py-1"
            />
            <button onClick={() => removeItem(item.id)} className="text-sm text-accent hover:underline">
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
        <span className="text-lg font-semibold text-ink">Total</span>
        <span className="text-2xl font-bold text-primary">
          {formatPrice(totalPrice, items[0]?.currency || "EUR")}
        </span>
      </div>
      <Link
        href="/checkout"
        className="mt-6 block rounded-full bg-primary px-6 py-3 text-center font-semibold text-white transition hover:bg-primary/90"
      >
        Proceed to checkout
      </Link>
    </div>
  );
}
