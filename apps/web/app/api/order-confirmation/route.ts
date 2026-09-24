import { NextResponse } from "next/server";
import { parseOrderSubmission, saveOrder } from "@/lib/orders";

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || "http://localhost:4003";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid order is required." }, { status: 400 });
  }

  const order = parseOrderSubmission(body);
  if (!order) {
    return NextResponse.json({ error: "A valid order is required." }, { status: 400 });
  }

  try {
    const response = await fetch(`${MAIL_SERVICE_URL}/order-confirmations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "We could not send your confirmation email. Please try again." },
        { status: 502 }
      );
    }

    await saveOrder(order);
    return NextResponse.json({ status: "sent" }, { status: 202 });
  } catch (error) {
    console.error("Order confirmation processing failed", error);
    return NextResponse.json(
      { error: "We could not send your confirmation email. Please try again." },
      { status: 502 }
    );
  }
}
