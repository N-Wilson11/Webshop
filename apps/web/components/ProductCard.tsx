"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, type Product } from "@/lib/api";
import { useCart } from "./CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    };
  }, []);

  function handleAddToCart() {
    addItem(product);
    setAdded(true);
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg">
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative h-48 w-full bg-secondary/20">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">🍪</div>
          )}
          {product.featured && (
            <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-white">
              Featured
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-display text-lg font-semibold text-ink">{product.name}</h3>
        </Link>
        <p className="line-clamp-2 flex-1 text-sm text-ink/70">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${
              added ? "add-to-cart-confirmation" : ""
            }`}
          >
            {product.stock <= 0 ? "Sold out" : added ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
