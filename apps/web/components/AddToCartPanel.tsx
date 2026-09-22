"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatPrice, type Product } from "@/lib/api";
import { useCart } from "@/components/CartProvider";

export function AddToCartPanel({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantityInCart = items.find((i) => i.id === product.id)?.quantity ?? 0;

  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    };
  }, []);

  function handleAddToCart() {
    addItem(product, quantity);
    setAdded(true);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-secondary/20 sm:h-96">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-8xl">🍪</div>
        )}
      </div>
      <h1 className="font-display text-3xl font-bold text-ink">{product.name}</h1>
      <p className="text-ink/70">{product.description}</p>
      <p className="text-2xl font-bold text-primary">{formatPrice(product.price, product.currency)}</p>
      <p className="text-sm text-ink/60">
        {product.stock > 0 ? `${product.stock} in stock` : "Currently sold out"}
      </p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={Math.max(product.stock, 1)}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-20 rounded-lg border border-black/10 px-3 py-2"
        />
        <div className="relative">
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${
              added ? "add-to-cart-confirmation" : ""
            }`}
          >
            {added ? "Added" : "Add to cart"}
          </button>
          {quantityInCart > 0 && (
            <span
              key={quantityInCart}
              aria-label={`${quantityInCart} in cart`}
              className="cart-add-animation absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white"
            >
              {quantityInCart}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
