"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function TestPayment() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const orderId = searchParams.get("order_id");

  async function confirmPayment() {
    if (!orderId) {
      setError("The test order ID is missing.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payments/mock/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = (await response.json()) as { completeUrl?: string; error?: string };

      if (!response.ok || !data.completeUrl) {
        throw new Error(data.error || "We could not confirm the test payment.");
      }

      router.replace(data.completeUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : "We could not confirm the test payment.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="font-display text-3xl font-bold text-ink">Test payment</h1>
      <p className="mt-3 text-ink/70">No money will be charged. Confirm to simulate a successful payment.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-center gap-4">
        <Link href="/checkout" className="rounded-full border border-black/10 px-6 py-3 font-semibold text-ink">
          Cancel
        </Link>
        <button
          onClick={confirmPayment}
          disabled={submitting || !orderId}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? "Confirming..." : "Confirm test payment"}
        </button>
      </div>
    </div>
  );
}

export default function TestPaymentPage() {
  return (
    <Suspense fallback={<p className="text-center text-ink/70">Preparing test payment…</p>}>
      <TestPayment />
    </Suspense>
  );
}
