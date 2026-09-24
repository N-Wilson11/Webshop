"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { fetchOrdersAdmin } from "@/lib/admin-api";
import { formatPrice } from "@/lib/api";
import type { AdminOrder } from "@/lib/order-types";

function OrdersList() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setOrders(await fetchOrdersAdmin());
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink">Orders</h1>
      {loading ? (
        <p className="text-ink/60">Loading…</p>
      ) : error ? (
        <p className="text-red-700">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-ink/60">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink">{order.name}</h2>
                  <a className="text-sm text-primary hover:underline" href={`mailto:${order.email}`}>
                    {order.email}
                  </a>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{formatPrice(order.totalPrice, order.currency)}</p>
                  <p className="text-sm text-ink/60">
                    {new Intl.DateTimeFormat("nl-NL", {
                      dateStyle: "medium",
                      timeStyle: "short"
                    }).format(new Date(order.createdAt))}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{order.address}</p>
              <ul className="mt-4 border-t border-black/10 pt-3 text-sm text-ink/80">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-${index}`}>
                    {item.quantity}× {item.name} — {formatPrice(item.price * item.quantity, item.currency)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <AdminGuard>
      <OrdersList />
    </AdminGuard>
  );
}
