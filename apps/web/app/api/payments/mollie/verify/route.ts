import { NextResponse } from "next/server";
import { verifyAndFulfillMolliePayment } from "@/lib/order-fulfillment";
import { getOrderPaymentStatus, getPaymentIdForOrder } from "@/lib/orders";

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

  try {
    const paymentId = await getPaymentIdForOrder(orderId);
    if ((process.env.PAYMENT_PROVIDER || "mock") === "mock") {
      const status = await getOrderPaymentStatus(orderId);
      return NextResponse.json({ status }, { status: status === "paid" ? 200 : 202 });
    }

    const status = await verifyAndFulfillMolliePayment(paymentId);
    return NextResponse.json({ status }, { status: status === "paid" ? 200 : 202 });
  } catch (error) {
    console.error("Unable to verify Mollie payment", error);
    return NextResponse.json({ error: "We could not verify the payment." }, { status: 502 });
  }
}
