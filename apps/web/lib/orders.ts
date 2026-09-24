import type { AdminOrder, OrderItem, OrderSubmission } from "./order-types";
import { PRODUCTS_API, type Product } from "./api";

type SupabaseOrder = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  delivery_address: string;
  items: OrderItem[];
  total_price: number;
  currency: string;
  payment_status: string;
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
    currency: order.currency,
    paymentStatus: order.payment_status
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
        typeof item.id === "string" &&
        item.id.length > 0 &&
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

export async function resolveOrderPricing(order: OrderSubmission): Promise<OrderSubmission> {
  const products = await Promise.all(
    order.items.map(async (item) => {
      const response = await fetch(`${PRODUCTS_API}/products/${encodeURIComponent(item.id)}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Product ${item.id} is no longer available`);
      }

      return (await response.json()) as Product;
    })
  );

  const currency = products[0].currency;
  if (products.some((product) => product.currency !== currency)) {
    throw new Error("Products with different currencies cannot be purchased together");
  }

  const items = order.items.map((item, index) => {
    const product = products[index];
    if (product.stock < item.quantity) {
      throw new Error(`${product.name} does not have enough stock`);
    }

    return {
      id: product.id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl
    };
  });
  const totalPrice = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return {
    ...order,
    items,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency
  };
}

export async function createPendingOrder(order: OrderSubmission) {
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
      currency: order.currency,
      payment_status: "open"
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Supabase could not save the order (${response.status})`);
  }

  const [savedOrder] = (await response.json()) as SupabaseOrder[];
  if (!savedOrder) {
    throw new Error("Supabase did not return the saved order");
  }

  return savedOrder;
}

export async function attachPaymentToOrder(orderId: string, paymentId: string) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=representation"
    },
    body: JSON.stringify({ payment_id: paymentId }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Supabase could not attach the payment (${response.status})`);
  }
}

export async function markOrderPaid(paymentId: string): Promise<OrderSubmission | null> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/orders?payment_id=eq.${encodeURIComponent(paymentId)}&payment_status=in.(open,pending)`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        payment_status: "paid",
        paid_at: new Date().toISOString()
      }),
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase could not update the payment status (${response.status})`);
  }

  const [order] = (await response.json()) as SupabaseOrder[];
  if (!order) return null;

  return {
    name: order.customer_name,
    email: order.customer_email,
    address: order.delivery_address,
    items: order.items,
    totalPrice: order.total_price,
    currency: order.currency
  };
}

export async function getPaymentIdForOrder(orderId: string) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/orders?select=payment_id&id=eq.${encodeURIComponent(orderId)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase could not load the payment (${response.status})`);
  }

  const [order] = (await response.json()) as Array<{ payment_id: string | null }>;
  if (!order?.payment_id) {
    throw new Error("No Mollie payment is associated with this order");
  }

  return order.payment_id;
}

export async function getOrderPaymentStatus(orderId: string) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/orders?select=payment_status&id=eq.${encodeURIComponent(orderId)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase could not load the order status (${response.status})`);
  }

  const [order] = (await response.json()) as Array<{ payment_status: string }>;
  if (!order) {
    throw new Error("Order does not exist");
  }

  return order.payment_status;
}

export async function getOrders(): Promise<AdminOrder[]> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const pageSize = 1000;
  const orders: SupabaseOrder[] = [];

  for (let from = 0; ; from += pageSize) {
    const response = await fetch(
      `${url}/rest/v1/orders?select=id,created_at,customer_name,customer_email,delivery_address,items,total_price,currency,payment_status&payment_status=eq.paid&order=created_at.desc`,
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
