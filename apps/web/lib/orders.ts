import type { AdminOrder, OrderItem, OrderSubmission } from "./order-types";

type SupabaseOrder = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  delivery_address: string;
  items: OrderItem[];
  total_price: number;
  currency: string;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured");
  }

  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

function toAdminOrder(order: SupabaseOrder): AdminOrder {
  return {
    id: order.id,
    createdAt: order.created_at,
    name: order.customer_name,
    email: order.customer_email,
    address: order.delivery_address,
    items: order.items,
    totalPrice: order.total_price,
    currency: order.currency
  };
}

export function parseOrderSubmission(value: unknown): OrderSubmission | null {
  if (!value || typeof value !== "object") return null;

  const order = value as Record<string, unknown>;
  if (
    typeof order.name !== "string" ||
    order.name.trim().length === 0 ||
    typeof order.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.email) ||
    typeof order.address !== "string" ||
    order.address.trim().length === 0 ||
    !Array.isArray(order.items) ||
    order.items.length === 0 ||
    !Number.isFinite(order.totalPrice) ||
    (order.totalPrice as number) < 0 ||
    typeof order.currency !== "string"
  ) {
    return null;
  }

  const items = order.items as OrderItem[];
  if (
    !items.every(
      (item) =>
        item &&
        typeof item.name === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        typeof item.currency === "string" &&
        (item.imageUrl === undefined || typeof item.imageUrl === "string")
    )
  ) {
    return null;
  }

  return {
    name: order.name.trim(),
    email: order.email.trim(),
    address: order.address.trim(),
    items,
    totalPrice: order.totalPrice as number,
    currency: order.currency
  };
}

export async function saveOrder(order: OrderSubmission) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify({
      customer_name: order.name,
      customer_email: order.email,
      delivery_address: order.address,
      items: order.items,
      total_price: order.totalPrice,
      currency: order.currency
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Supabase could not save the order (${response.status})`);
  }
}

export async function getOrders(): Promise<AdminOrder[]> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const pageSize = 1000;
  const orders: SupabaseOrder[] = [];

  for (let from = 0; ; from += pageSize) {
    const response = await fetch(
      `${url}/rest/v1/orders?select=id,created_at,customer_name,customer_email,delivery_address,items,total_price,currency&order=created_at.desc`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Range: `${from}-${from + pageSize - 1}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase could not load orders (${response.status})`);
    }

    const page = (await response.json()) as SupabaseOrder[];
    orders.push(...page);

    if (page.length < pageSize) {
      return orders.map(toAdminOrder);
    }
  }
}
