"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { ProductForm } from "@/components/ProductForm";
import { PRODUCTS_API_PUBLIC } from "@/lib/api";
import type { Product } from "@/lib/api";

function EditProductForm() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${PRODUCTS_API_PUBLIC}/products/${params.id}`)
      .then((res) => res.json())
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-ink/60">Loading…</p>;
  if (!product) return <p className="text-ink/60">Product not found.</p>;

  return <ProductForm product={product} />;
}

export default function EditProductPage() {
  return (
    <AdminGuard>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Edit product</h1>
      <EditProductForm />
    </AdminGuard>
  );
}
