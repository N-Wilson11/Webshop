import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Header } from "@/components/Header";
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
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it("confirms additions and animates the cart", () => {
    render(
      <CartProvider>
        <Header shopName="Cookie Corner" />
        <ProductCard product={sampleProduct} />
      </CartProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(screen.getByRole("button", { name: "Added" })).toBeInTheDocument();
    const cart = screen.getByRole("link", { name: "Cart, 1 item" });
    expect(cart.querySelector(".cart-add-animation")).toBeInTheDocument();
  });

  it("shows an incrementing quantity badge when clicked multiple times", () => {
    render(
      <CartProvider>
        <ProductCard product={sampleProduct} />
      </CartProvider>
    );

    const button = screen.getByRole("button", { name: "Add to cart" });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.getByLabelText("3 in cart")).toBeInTheDocument();
  });
});
