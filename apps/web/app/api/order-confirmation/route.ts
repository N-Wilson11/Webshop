import { NextResponse } from "next/server";

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || "http://localhost:4003";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const response = await fetch(`${MAIL_SERVICE_URL}/order-confirmations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "We could not send your confirmation email. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ status: "sent" }, { status: 202 });
  } catch (error) {
    console.error("Order confirmation mail service request failed", error);
    return NextResponse.json(
      { error: "We could not send your confirmation email. Please try again." },
      { status: 502 }
    );
  }
}
