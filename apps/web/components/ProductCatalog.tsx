"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/api";
import { ProductCard } from "./ProductCard";

export function ProductCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b)),
    [products]
  );
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "all" || product.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.description, product.category].some((value) =>
          value.toLowerCase().includes(normalizedQuery)
        );
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);
  const featuredProducts = products.filter((product) => product.featured);
  const isFiltering = category !== "all" || query.trim().length > 0;

  if (products.length === 0) {
    return (
      <p className="text-ink/70">
        No products yet. Add some from the <a href="/admin" className="text-primary underline">admin CMS</a>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {featuredProducts.length > 0 && !isFiltering && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold text-ink">Featured Products</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-4">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {isFiltering ? "Matching products" : "All Products"}
          </h2>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="max-w-md rounded-lg border border-black/10 bg-white px-4 py-2"
          />
          <div className="flex flex-wrap gap-2" aria-label="Product categories">
            <button
              onClick={() => setCategory("all")}
              aria-pressed={category === "all"}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === "all" ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-black/10"
              }`}
            >
              All
            </button>
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === item ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-black/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <p className="text-ink/70">No products match your search and category.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
