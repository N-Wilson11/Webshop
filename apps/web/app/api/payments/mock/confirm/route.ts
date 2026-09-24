import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/order-fulfillment";
import { getPaymentIdForOrder } from "@/lib/orders";

export async function POST(request: Request) {
  let orderId: unknown;

  try {
    ({ orderId } = await request.json());
  } catch {
    return NextResponse.json({ error: "An order ID is required." }, { status: 400 });
  }

  if (
    typeof orderId !== "string" ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(orderId)
  ) {
    return NextResponse.json({ error: "A valid order ID is required." }, { status: 400 });
  }

  if ((process.env.PAYMENT_PROVIDER || "mock") !== "mock") {
    return NextResponse.json({ error: "Test payments are disabled." }, { status: 404 });
  }

  try {
    const paymentId = await getPaymentIdForOrder(orderId);
    if (!paymentId.startsWith("test_")) {
      return NextResponse.json({ error: "This order does not use a test payment." }, { status: 400 });
    }

    await fulfillPaidOrder(paymentId);
    return NextResponse.json({ completeUrl: `/checkout/complete?order_id=${orderId}` });
  } catch (error) {
    console.error("Unable to confirm test payment", error);
    return NextResponse.json({ error: "We could not confirm the test payment." }, { status: 502 });
  }
}
