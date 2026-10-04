"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";
import { fetchProductsAdmin, deleteProduct } from "@/lib/admin-api";
import { formatPrice, type Product } from "@/lib/api";

function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  async function load() {
    setLoading(true);
    setProducts(await fetchProductsAdmin());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    load();
  }

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-ink">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          + Add product
        </Link>
      </div>
      {loading ? (
        <p className="text-ink/60">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-ink/60">No products yet. Add your first cookie!</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="rounded-lg border border-black/10 bg-white px-4 py-2"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
              className="rounded-lg border border-black/10 bg-white px-4 py-2"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-ink/60">No products match your search and category.</p>
          ) : (
            <table className="w-full overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-black/5">
              <thead className="bg-black/5 text-sm text-ink/60">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Stock</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-t border-black/5">
                    <td className="px-4 py-2 font-medium">{p.name}</td>
                    <td className="px-4 py-2">{formatPrice(p.price, p.currency)}</td>
                    <td className="px-4 py-2">{p.stock}</td>
                    <td className="px-4 py-2">{p.category}</td>
                    <td className="flex gap-3 px-4 py-2">
                      <Link href={`/admin/products/${p.id}/edit`} className="text-primary hover:underline">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(p.id)} className="text-accent hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminGuard>
      <ProductsList />
    </AdminGuard>
  );
}
