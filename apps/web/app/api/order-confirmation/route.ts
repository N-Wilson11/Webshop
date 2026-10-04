import { NextResponse } from "next/server";
import { sendAdminOrderDiscordNotification } from "@/lib/admin-discord";
import { getTheme, PRODUCTS_API } from "@/lib/api";
import { parseOrderSubmission, saveOrder } from "@/lib/orders";

const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || "http://localhost:4003";
const PRODUCTS_SERVICE_TOKEN = process.env.ADMIN_TOKEN || "admin-secret";

async function updateReservedStock(
  action: "reserve-stock" | "release-stock",
  items: Array<{ id: string; quantity: number }>
) {
  const response = await fetch(`${PRODUCTS_API}/products/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PRODUCTS_SERVICE_TOKEN}`
    },
    body: JSON.stringify({ items }),
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    try {
      const parsed = JSON.parse(body) as { error?: string };
      throw new Error(parsed.error || "Unable to update product stock.");
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error("Unable to verify product stock. Please try again later.");
      }
      throw error;
    }
  }
}

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
    await updateReservedStock(
      "reserve-stock",
      order.items.map((item) => ({ id: item.id, quantity: item.quantity }))
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "One or more products are out of stock." },
      { status: 409 }
    );
  }

  try {
    await saveOrder(order);
  } catch (error) {
    console.error("Order could not be saved", error);
    try {
      await updateReservedStock(
        "release-stock",
        order.items.map((item) => ({ id: item.id, quantity: item.quantity }))
      );
    } catch (releaseError) {
      console.error("Reserved product stock could not be released", releaseError);
    }
    return NextResponse.json(
      { error: "We could not place your order. Please try again." },
      { status: 500 }
    );
  }

  let response: Response;
  try {
    const theme = await getTheme();
    response = await fetch(`${MAIL_SERVICE_URL}/order-confirmations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, theme }),
      cache: "no-store"
    });
  } catch (error) {
    console.error("Order confirmation mail service request failed", error);
    return NextResponse.json(
      { status: "placed", confirmationEmailSent: false },
      { status: 202 }
    );
  }

  if (!response.ok) {
    console.error("Order confirmation mail service returned an error", response.status);
    return NextResponse.json({ status: "placed", confirmationEmailSent: false }, { status: 202 });
  }

  try {
    await sendAdminOrderDiscordNotification(order);
  } catch (error) {
    console.error("Admin order Discord notification failed", error);
  }

  return NextResponse.json({ status: "placed", confirmationEmailSent: true }, { status: 202 });
}
