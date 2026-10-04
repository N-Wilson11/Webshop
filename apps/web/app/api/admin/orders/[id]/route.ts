import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { completeOrder, deleteOrder } from "@/lib/orders";

function isAdmin(authorization: string | null) {
  const expectedToken = process.env.ADMIN_TOKEN;
  const providedToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!expectedToken || !providedToken) return false;

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

function isValidOrderId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAdmin(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValidOrderId(params.id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    await completeOrder(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unable to complete order", error);
    return NextResponse.json({ error: "Unable to complete order" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!isAdmin(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isValidOrderId(params.id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    await deleteOrder(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unable to delete order", error);
    return NextResponse.json({ error: "Unable to delete order" }, { status: 500 });
  }
}
