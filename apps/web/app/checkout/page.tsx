"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/api";

type CheckoutForm = {
  name: string;
  email: string;
  street: string;
  houseNumber: string;
  houseNumberAddition: string;
  postalCode: string;
  city: string;
  country: string;
};

function formatDeliveryAddress(form: CheckoutForm) {
  const houseNumber = `${form.houseNumber}${form.houseNumberAddition ? ` ${form.houseNumberAddition}` : ""}`;
  return `${form.street} ${houseNumber}\n${form.postalCode.toUpperCase()} ${form.city}\n${form.country}`;
}

export default function CheckoutPage() {
  const { items, totalPrice, clear, iconUrl } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    email: "",
    street: "",
    houseNumber: "",
    houseNumberAddition: "",
    postalCode: "",
    city: "",
    country: "Nederland"
  });

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <Image src={iconUrl} alt="" width={64} height={64} className="mx-auto mb-3 h-16 w-16 rounded-full object-cover" unoptimized />
        <h1 className="font-display text-3xl font-bold text-ink">Thank you!</h1>
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
                address: formatDeliveryAddress(form),
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
        <fieldset className="flex flex-col gap-4">
          <legend className="font-semibold text-ink">Contact details</legend>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-ink">
              Full name
            </label>
            <input
              id="name"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border border-black/10 px-4 py-2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="email"
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-black/10 px-4 py-2"
            />
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-4 border-t border-black/10 pt-4">
          <legend className="font-semibold text-ink">Delivery address</legend>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="street" className="text-sm font-medium text-ink">
              Street name
            </label>
            <input
              id="street"
              required
              autoComplete="address-line1"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="rounded-lg border border-black/10 px-4 py-2"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="house-number" className="text-sm font-medium text-ink">
                House number
              </label>
              <input
                id="house-number"
                required
                inputMode="numeric"
                pattern="[0-9]+"
                autoComplete="address-line1"
                value={form.houseNumber}
                onChange={(e) => setForm({ ...form, houseNumber: e.target.value })}
                className="rounded-lg border border-black/10 px-4 py-2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="house-number-addition" className="text-sm font-medium text-ink">
                Addition <span className="font-normal text-ink/60">(optional)</span>
              </label>
              <input
                id="house-number-addition"
                autoComplete="address-line2"
                value={form.houseNumberAddition}
                onChange={(e) => setForm({ ...form, houseNumberAddition: e.target.value })}
                className="rounded-lg border border-black/10 px-4 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="postal-code" className="text-sm font-medium text-ink">
                Postal code
              </label>
              <input
                id="postal-code"
                required
                autoComplete="postal-code"
                inputMode="text"
                pattern="[1-9][0-9]{3}[ ]?[A-Za-z]{2}"
                title="Enter a valid Dutch postal code, for example 1234 AB."
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="rounded-lg border border-black/10 px-4 py-2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="text-sm font-medium text-ink">
                City
              </label>
              <input
                id="city"
                required
                autoComplete="address-level2"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="rounded-lg border border-black/10 px-4 py-2"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="country" className="text-sm font-medium text-ink">
              Country
            </label>
            <select
              id="country"
              required
              autoComplete="country-name"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="rounded-lg border border-black/10 bg-white px-4 py-2"
            >
              <option value="Nederland">Nederland</option>
              <option value="België">België</option>
              <option value="Duitsland">Duitsland</option>
            </select>
          </div>
        </fieldset>
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
