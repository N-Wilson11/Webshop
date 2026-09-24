import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createMolliePayment } from "@/lib/mollie";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";
import {
  attachPaymentToOrder,
  createPendingOrder,
  parseOrderSubmission,
  resolveOrderPricing
} from "@/lib/orders";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid order is required." }, { status: 400 });
  }

  const submittedOrder = parseOrderSubmission(body);
  if (!submittedOrder) {
    return NextResponse.json({ error: "A valid order is required." }, { status: 400 });
  }

  let order;

  try {
    order = await resolveOrderPricing(submittedOrder);
  } catch (error) {
    console.error("Unable to validate order pricing", error);
    return NextResponse.json({ error: "One or more products are unavailable. Refresh your cart and try again." }, { status: 400 });
  }

  try {
    const pendingOrder = await createPendingOrder(order);
    const paymentProvider = process.env.PAYMENT_PROVIDER || "mock";

    if (paymentProvider === "mock") {
      const paymentId = `test_${randomUUID()}`;
      await attachPaymentToOrder(pendingOrder.id, paymentId);
      return NextResponse.json({ checkoutUrl: `/checkout/test?order_id=${pendingOrder.id}` });
    }

    if (paymentProvider !== "mollie") {
      throw new Error("PAYMENT_PROVIDER must be either mock or mollie");
    }

    const payment = await createMolliePayment(order, pendingOrder.id);
    await attachPaymentToOrder(pendingOrder.id, payment.id);

    return NextResponse.json({ checkoutUrl: payment._links.checkout.href });
  } catch (error) {
    console.error("Unable to start Mollie payment", error);
    return NextResponse.json({ error: "We could not start the payment. Please try again." }, { status: 502 });
  }
}
