import type { Order, OrderItem, OrderStatus } from "@joe-perks/db";

const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

type OrderDetailModel = Order & {
  buyer: { name: string | null } | null;
  campaign: {
    org: {
      application: { orgName: string | null };
      slug: string;
    };
  };
  items: OrderItem[];
  roaster: {
    application: { businessName: string | null };
    email: string;
  };
};

const statusLabels: Record<OrderStatus, string> = {
  CANCELLED: "Cancelled",
  CONFIRMED: "Confirmed",
  DELIVERED: "Delivered",
  PENDING: "Pending",
  REFUNDED: "Refunded",
  SHIPPED: "Shipped",
};

export function OrderDetail({ order }: { readonly order: OrderDetailModel }) {
  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;
  const roasterLabel =
    order.roaster.application.businessName ?? order.roaster.email;
  const subtotal = order.items.reduce((s, i) => s + i.lineTotal, 0);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-zinc-500">Order {order.orderNumber}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-2xl">Details</h2>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
            {statusLabels[order.status]}
          </span>
        </div>
        <p className="text-sm text-zinc-600">
          Roaster: {roasterLabel} · Fundraiser: {orgName}
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="font-semibold text-sm">Line items</h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Qty</th>
                <th className="px-3 py-2 font-medium">Each</th>
                <th className="px-3 py-2 font-medium">Line</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  className="border-zinc-100 border-t dark:border-zinc-800"
                  key={item.id}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-zinc-500">
                      {item.variantDesc}
                    </div>
                  </td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">{formatUsd(item.unitPrice)}</td>
                  <td className="px-3 py-2">{formatUsd(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="mb-2 font-semibold">Amounts</h3>
          <div className="flex justify-between">
            <span className="text-zinc-600">Subtotal</span>
            <span>{formatUsd(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Shipping</span>
            <span>{formatUsd(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatUsd(order.grossAmount)}</span>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="mb-2 font-semibold">Split (frozen)</h3>
          <div className="flex justify-between">
            <span className="text-zinc-600">Org</span>
            <span>{formatUsd(order.orgAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Platform</span>
            <span>{formatUsd(order.platformAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Roaster product</span>
            <span>{formatUsd(order.roasterAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Roaster total</span>
            <span>{formatUsd(order.roasterTotal)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="mb-2 font-semibold">Shipping</h3>
        <p className="text-sm text-zinc-600">
          Tracking:{" "}
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            {order.trackingNumber ?? "—"}
          </span>
        </p>
        <p className="text-sm text-zinc-600">Carrier: {order.carrier ?? "—"}</p>
        <p className="text-sm text-zinc-600">
          Shipped: {order.shippedAt ? order.shippedAt.toLocaleString() : "—"}
        </p>
        <p className="text-sm text-zinc-600">
          Delivered:{" "}
          {order.deliveredAt ? order.deliveredAt.toLocaleString() : "—"}
        </p>
        <p className="text-sm text-zinc-600">
          Payout eligible after:{" "}
          {order.payoutEligibleAt
            ? order.payoutEligibleAt.toLocaleString()
            : "—"}
        </p>
      </section>
    </div>
  );
}
