export type Theme = {
  shopName: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  imageUrl: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_THEME: Theme = {
  shopName: "Cookie Corner",
  tagline: "Freshly baked happiness, delivered to your door.",
  colors: {
    primary: "#8B5E3C",
    secondary: "#F4B942",
    accent: "#D96C4C",
    background: "#FFF8F0",
    text: "#3A2618"
  }
};

// Server-side base URL (works inside Docker network, e.g. http://products-service:4001)
export const PRODUCTS_API =
  process.env.PRODUCTS_API_URL || process.env.NEXT_PUBLIC_PRODUCTS_API_URL || "http://localhost:4001";

// Client-side base URL (must be reachable from the browser)
export const PRODUCTS_API_PUBLIC = process.env.NEXT_PUBLIC_PRODUCTS_API_URL || "http://localhost:4001";

export const UPLOAD_API_PUBLIC = process.env.NEXT_PUBLIC_UPLOAD_API_URL || "http://localhost:4002";

export async function getTheme(): Promise<Theme> {
  try {
    const res = await fetch(`${PRODUCTS_API}/settings/theme`, { cache: "no-store" });
    if (!res.ok) return DEFAULT_THEME;
    return (await res.json()) as Theme;
  } catch {
    return DEFAULT_THEME;
  }
}

export async function getProducts(category?: string): Promise<Product[]> {
  try {
    const url = category
      ? `${PRODUCTS_API}/products?category=${encodeURIComponent(category)}`
      : `${PRODUCTS_API}/products`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Product[];
  } catch {
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${PRODUCTS_API}/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

export function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(price);
}
