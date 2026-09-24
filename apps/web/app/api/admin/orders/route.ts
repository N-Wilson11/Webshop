import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getOrders } from "@/lib/orders";

function isAdmin(authorization: string | null) {
  const expectedToken = process.env.ADMIN_TOKEN;
  const providedToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!expectedToken || !providedToken) return false;

  const expected = Buffer.from(expectedToken);
  const provided = Buffer.from(providedToken);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

export async function GET(request: Request) {
  if (!isAdmin(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getOrders());
  } catch (error) {
    console.error("Unable to load orders", error);
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}
