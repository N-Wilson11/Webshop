"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/api";
import { createProduct, updateProduct, uploadImage } from "@/lib/admin-api";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price ?? 0,
    currency: product?.currency || "EUR",
    category: product?.category || "cookies",
    stock: product?.stock ?? 0,
    imageUrl: product?.imageUrl || "",
    featured: product?.featured || false
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (product) {
        await updateProduct(product.id, form);
      } else {
        await createProduct(form);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink">Name</span>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-black/10 px-4 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-lg border border-black/10 px-4 py-2"
          rows={3}
        />
      </label>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-ink">Price</span>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-4 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-ink">Currency</span>
          <input
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="rounded-lg border border-black/10 px-4 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-ink">Stock</span>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="rounded-lg border border-black/10 px-4 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink">Category</span>
        <input
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="rounded-lg border border-black/10 px-4 py-2"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
        />
        <span className="text-sm font-medium text-ink">Featured product</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-ink">Product image</span>
        <input type="file" accept="image/*" onChange={handleFile} />
        {uploading && <span className="text-xs text-ink/60">Uploading…</span>}
        {form.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.imageUrl} alt="Preview" className="mt-2 h-32 w-32 rounded-lg object-cover" />
        )}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Saving…" : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
