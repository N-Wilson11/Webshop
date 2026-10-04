"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { OrdersList } from "../OrdersList";

export default function CompletedOrdersPage() {
  return (
    <AdminGuard>
      <OrdersList completed />
    </AdminGuard>
  );
}
