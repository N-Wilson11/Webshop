import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/ProductCard";
import { CartProvider } from "@/components/CartProvider";
import type { Product } from "@/lib/api";

const sampleProduct: Product = {
  id: "choc-chip",
  name: "Classic Chocolate Chip",
  description: "A timeless favorite.",
  price: 3.5,
  currency: "EUR",
  category: "cookies",
  stock: 10,
  imageUrl: "",
  featured: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe("ProductCard", () => {
  it("renders product name and price", () => {
    render(
      <CartProvider>
        <ProductCard product={sampleProduct} />
      </CartProvider>
    );
    expect(screen.getByText("Classic Chocolate Chip")).toBeInTheDocument();
    expect(screen.getByText("€3.50")).toBeInTheDocument();
    expect(screen.getByText("Add to cart")).toBeInTheDocument();
  });

  it("shows sold out when stock is zero", () => {
    render(
      <CartProvider>
        <ProductCard product={{ ...sampleProduct, stock: 0 }} />
      </CartProvider>
    );
    expect(screen.getByText("Sold out")).toBeInTheDocument();
  });
});
