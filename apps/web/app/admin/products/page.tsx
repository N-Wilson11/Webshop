"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";
import { fetchProductsAdmin, deleteProduct } from "@/lib/admin-api";
import { formatPrice, type Product } from "@/lib/api";

function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
            {products.map((p) => (
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
