"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartProvider";

export function Header({ shopName, iconUrl = "/icon.svg" }: { shopName: string; iconUrl?: string }) {
  const { totalItems, cartAnimation } = useCart();
  const cartLabel = `Cart, ${totalItems} ${totalItems === 1 ? "item" : "items"}`;

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-2xl font-bold tracking-wide">
          <span className="inline-flex items-center gap-2">
            <Image src={iconUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
            {shopName}
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-secondary">
            Shop
          </Link>
          <Link href="/cart" aria-label={cartLabel} className="hover:text-secondary">
            <span
              key={cartAnimation}
              className={`relative inline-flex ${cartAnimation > 0 ? "cart-add-animation" : ""}`}
            >
              Cart
              {totalItems > 0 && (
                <span className="absolute -right-3 -top-2 rounded-full bg-accent px-1.5 text-xs text-white">
                  {totalItems}
                </span>
              )}
            </span>
          </Link>
          <Link href="/admin" className="hover:text-secondary">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
