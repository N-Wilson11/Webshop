"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";

function CheckoutComplete() {
  const searchParams = useSearchParams();
  const { clear } = useCart();
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId) {
      setStatus("error");
      setError("Mollie did not return an order ID.");
      return;
    }

    async function verifyPayment() {
      try {
        const response = await fetch("/api/payments/mollie/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId })
        });
        const data = (await response.json()) as { status?: string; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "We could not verify the payment.");
        }

        if (data.status === "paid") {
          clear();
          setStatus("paid");
        } else {
          setStatus("pending");
        }
      } catch (error) {
        setStatus("error");
        setError(error instanceof Error ? error.message : "We could not verify the payment.");
      }
    }

    verifyPayment();
  }, [clear, searchParams]);

  if (status === "checking") {
    return <p className="text-center text-ink/70">Confirming your payment…</p>;
  }

  if (status === "paid") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Payment received! 🍪</h1>
        <p className="mt-3 text-ink/70">Your order is confirmed and a confirmation email is on its way.</p>
        <Link href="/" className="mt-6 inline-block text-primary underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Payment is still pending</h1>
        <p className="mt-3 text-ink/70">Refresh this page after completing the payment in Mollie.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="font-display text-3xl font-bold text-ink">We could not confirm the payment</h1>
      <p className="mt-3 text-red-700">{error}</p>
      <Link href="/checkout" className="mt-6 inline-block text-primary underline">
        Return to checkout
      </Link>
    </div>
  );
}

export default function CheckoutCompletePage() {
  return (
    <Suspense fallback={<p className="text-center text-ink/70">Preparing payment confirmation…</p>}>
      <CheckoutComplete />
    </Suspense>
  );
}
