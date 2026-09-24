import type { OrderSubmission } from "./order-types";

const MOLLIE_API_URL = "https://api.mollie.com/v2/payments";

export type MolliePayment = {
  id: string;
  status: "open" | "pending" | "paid" | "canceled" | "expired" | "failed";
  metadata?: { order_id?: string };
  _links: {
    checkout: { href: string };
  };
};

function getMollieApiKey() {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error("MOLLIE_API_KEY must be configured");
  }

  return apiKey;
}

function getAppUrl() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL must be configured with the public storefront URL");
  }

  return new URL(appUrl);
}

function mollieHeaders() {
  return {
    Authorization: `Bearer ${getMollieApiKey()}`,
    "Content-Type": "application/json"
  };
}

export async function createMolliePayment(order: OrderSubmission, orderId: string) {
  const appUrl = getAppUrl();
  const response = await fetch(MOLLIE_API_URL, {
    method: "POST",
    headers: mollieHeaders(),
    body: JSON.stringify({
      amount: {
        currency: order.currency,
        value: order.totalPrice.toFixed(2)
      },
      description: `Cookie Corner order ${orderId}`,
      redirectUrl: new URL(`/checkout/complete?order_id=${encodeURIComponent(orderId)}`, appUrl).toString(),
      webhookUrl: new URL("/api/payments/mollie/webhook", appUrl).toString(),
      metadata: { order_id: orderId }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Mollie could not create the payment (${response.status})`);
  }

  return (await response.json()) as MolliePayment;
}

export async function getMolliePayment(paymentId: string) {
  const response = await fetch(`${MOLLIE_API_URL}/${encodeURIComponent(paymentId)}`, {
    headers: mollieHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Mollie could not retrieve the payment (${response.status})`);
  }

  return (await response.json()) as MolliePayment;
}
