import { NextResponse } from "next/server";
import { sendAdminOrderDiscordNotification } from "@/lib/admin-discord";
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

  let response: Response;

  try {
    response = await fetch(`${MAIL_SERVICE_URL}/order-confirmations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      cache: "no-store"
    });
  } catch (error) {
    console.error("Order confirmation mail service request failed", error);
    return NextResponse.json(
      { error: "We could not send your confirmation email. Please try again." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "We could not send your confirmation email. Please try again." },
      { status: 502 }
    );
  }

  try {
    await saveOrder(order);
  } catch (error) {
    console.error("Order could not be saved", error);
    return NextResponse.json(
      { error: "Your confirmation email was sent, but we could not save the order." },
      { status: 500 }
    );
  }

  try {
    await sendAdminOrderDiscordNotification(order);
  } catch (error) {
    console.error("Admin order Discord notification failed", error);
  }

  return NextResponse.json({ status: "sent" }, { status: 202 });
}
