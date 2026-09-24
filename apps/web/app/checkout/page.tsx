"use client";

import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/api";

export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", address: "" });

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Thank you! 🍪</h1>
        <p className="mt-3 text-ink/70">
          Your order has been placed. This is a demo checkout — plug in a real payment
          provider (e.g. Stripe) for production use.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-center text-ink/70">Your cart is empty. Add some cookies first!</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Checkout</h1>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setIsSubmitting(true);

          try {
            const response = await fetch("/api/order-confirmation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: form.email,
                name: form.name,
                address: form.address,
                items,
                totalPrice,
                currency: items[0]?.currency || "EUR"
              })
            });

            if (!response.ok) {
              const data = (await response.json()) as { error?: string };
              throw new Error(data.error || "We could not send your confirmation email.");
            }

            setSubmitted(true);
            clear();
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "We could not send your confirmation email."
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-black/10 px-4 py-2"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border border-black/10 px-4 py-2"
        />
        <textarea
          required
          placeholder="Delivery address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="rounded-lg border border-black/10 px-4 py-2"
          rows={3}
        />
        <div className="flex items-center justify-between border-t border-black/10 pt-4">
          <span className="font-semibold text-ink">Total due</span>
          <span className="text-xl font-bold text-primary">
            {formatPrice(totalPrice, items[0]?.currency || "EUR")}
          </span>
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90"
        >
          {isSubmitting ? "Sending confirmation..." : "Place order"}
        </button>
      </form>
    </div>
  );
}
