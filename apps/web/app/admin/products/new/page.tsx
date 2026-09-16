"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { ProductForm } from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <AdminGuard>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Add product</h1>
      <ProductForm />
    </AdminGuard>
  );
}
