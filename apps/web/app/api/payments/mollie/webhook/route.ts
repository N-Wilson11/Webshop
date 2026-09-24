import { NextResponse } from "next/server";
import { verifyAndFulfillMolliePayment } from "@/lib/order-fulfillment";

export async function POST(request: Request) {
  const formData = await request.formData();
  const paymentId = formData.get("id");

  if (typeof paymentId !== "string" || !paymentId.startsWith("tr_")) {
    return NextResponse.json({ error: "A valid payment ID is required." }, { status: 400 });
  }

  try {
    await verifyAndFulfillMolliePayment(paymentId);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Unable to process Mollie webhook", error);
    return new NextResponse(null, { status: 500 });
  }
}
