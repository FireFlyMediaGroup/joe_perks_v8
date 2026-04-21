import type { Order, OrderEvent, OrderItem, OrderStatus, PayoutStatus } from "@joe-perks/db";

import { PortalTrackingForm } from "@/app/(authenticated)/dashboard/_components/portal-tracking-form";

const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

type OrderDetailModel = Order & {
  buyer: { email: string; name: string | null } | null;
  campaign: {
    name: string;
    org: {
      application: { orgName: string | null };
      slug: string;
    };
  };
  events: OrderEvent[];
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

const payoutLabels: Record<PayoutStatus, string> = {
  FAILED: "Failed",
  HELD: "Held",
  PENDING: "Pending",
  TRANSFERRED: "Transferred",
};

export function OrderDetail({ order }: { readonly order: OrderDetailModel }) {
  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;
  const roasterLabel =
    order.roaster.application.businessName ?? order.roaster.email;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">Order {order.orderNumber}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-2xl">Order details</h1>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
            {statusLabels[order.status]}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-900">
            Payout {payoutLabels[order.payoutStatus]}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Fundraiser: {orgName} · Campaign: {order.campaign.name} · Roaster:{" "}
          {roasterLabel}
        </p>
      </header>

      {order.status === "CONFIRMED" ? (
        <section className="rounded-xl border p-5">
          <h2 className="font-semibold text-lg">Add tracking</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Confirm shipment from the dashboard instead of using the email magic
            link.
          </p>
          <div className="mt-4">
            <PortalTrackingForm orderId={order.id} orderNumber={order.orderNumber} />
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold text-base">Buyer</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd>{order.buyer?.name ?? order.shipToName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="break-all">{order.buyer?.email ?? order.buyerEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{order.createdAt.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border p-5">
          <h2 className="font-semibold text-base">Shipping address</h2>
          <div className="mt-3 text-sm">
            <p>{order.shipToName}</p>
            <p>{order.shipToAddress1}</p>
            {order.shipToAddress2 ? <p>{order.shipToAddress2}</p> : null}
            <p>
              {order.shipToCity}, {order.shipToState} {order.shipToPostalCode}
            </p>
            <p>{order.shipToCountry}</p>
          </div>
        </div>

        <div className="rounded-xl border p-5">
          <h2 className="font-semibold text-base">Fulfillment</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Fulfill by</dt>
              <dd>{order.fulfillBy.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tracking</dt>
              <dd className="font-mono">{order.trackingNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Carrier</dt>
              <dd>{order.carrier ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Shipped</dt>
              <dd>{order.shippedAt ? order.shippedAt.toLocaleString() : "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-lg">Line items</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Each</th>
                <th className="px-4 py-3 font-medium">Line</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr className="border-t" key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.variantDesc}
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">{formatUsd(item.unitPrice)}</td>
                  <td className="px-4 py-3">{formatUsd(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold text-base">Amounts</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatUsd(order.productSubtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{formatUsd(order.shippingAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <dt>Total</dt>
              <dd>{formatUsd(order.grossAmount)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border p-5">
          <h2 className="font-semibold text-base">Split snapshot</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Org</dt>
              <dd>{formatUsd(order.orgAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Platform</dt>
              <dd>{formatUsd(order.platformAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Roaster product</dt>
              <dd>{formatUsd(order.roasterAmount)}</dd>
            </div>
            <div className="flex justify-between gap-4 font-semibold">
              <dt>Roaster total</dt>
              <dd>{formatUsd(order.roasterTotal)}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
