"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice, type Product } from "@/lib/api";
import { useCart } from "@/components/CartProvider";

export function AddToCartPanel({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
        <button
          onClick={() => {
            addItem(product, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          disabled={product.stock <= 0}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
