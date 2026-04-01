import type { OrderStatus } from "@joe-perks/db";
import Link from "next/link";

interface Row {
  buyerName: string | null;
  id: string;
  orderDate: Date;
  orderNumber: string;
  roasterLabel: string;
  shippedAt: Date | null;
  status: OrderStatus;
  trackingNumber: string | null;
}

const statusLabels: Record<OrderStatus, string> = {
  CANCELLED: "Cancelled",
  CONFIRMED: "Confirmed",
  DELIVERED: "Delivered",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  SHIPPED: "Shipped",
};

function tabClass(active: boolean) {
  return `inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium ${
    active
      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
      : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
  }`;
}

export function OrderList({
  orders,
  statusFilter,
}: {
  readonly orders: Row[];
  readonly statusFilter: OrderStatus | "ALL";
}) {
  const tabs: Array<{
    href: string;
    label: string;
    value: OrderStatus | "ALL";
  }> = [
    { href: "/orders", label: "Shipped", value: "SHIPPED" },
    {
      href: "/orders?status=CONFIRMED",
      label: "Confirmed",
      value: "CONFIRMED",
    },
    {
      href: "/orders?status=DELIVERED",
      label: "Delivered",
      value: "DELIVERED",
    },
    {
      href: "/orders?status=REFUNDED",
      label: "Refunded",
      value: "REFUNDED",
    },
    { href: "/orders?status=ALL", label: "All", value: "ALL" },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            className={tabClass(statusFilter === t.value)}
            href={t.href}
            key={t.value}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Roaster</th>
              <th className="px-3 py-2 font-medium">Buyer</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Shipped</th>
              <th className="px-3 py-2 font-medium">Tracking</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-zinc-500" colSpan={7}>
                  No orders for this filter.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr
                  className="border-zinc-100 border-t dark:border-zinc-800"
                  key={o.id}
                >
                  <td className="px-3 py-2 font-medium">
                    <Link
                      className="text-zinc-900 underline underline-offset-2 dark:text-zinc-50"
                      href={`/orders/${o.id}`}
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{o.roasterLabel}</td>
                  <td className="px-3 py-2">{o.buyerName ?? "—"}</td>
                  <td className="px-3 py-2 text-zinc-600">
                    {o.orderDate.toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-zinc-600">
                    {o.shippedAt ? o.shippedAt.toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {o.trackingNumber ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
                      {statusLabels[o.status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
