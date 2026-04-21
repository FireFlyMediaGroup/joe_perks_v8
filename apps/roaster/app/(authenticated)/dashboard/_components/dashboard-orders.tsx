import { database } from "@joe-perks/db";
import Link from "next/link";

import { PortalTrackingForm } from "./portal-tracking-form";

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const orderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  createdAt: true,
  shippedAt: true,
  grossAmount: true,
  buyerEmail: true,
  trackingNumber: true,
  carrier: true,
  campaign: {
    select: {
      org: {
        select: {
          slug: true,
          application: { select: { orgName: true } },
        },
      },
    },
  },
} as const;

interface Props {
  readonly roasterId: string;
}

export async function DashboardOrders({ roasterId }: Props) {
  const [statusCounts, pendingPayment, needsFulfillment, recentShipped] =
    await Promise.all([
      database.order.groupBy({
        by: ["status"],
        where: { roasterId },
        _count: { _all: true },
      }),
      database.order.findMany({
        where: { roasterId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: orderListSelect,
      }),
      database.order.findMany({
        where: { roasterId, status: "CONFIRMED" },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: orderListSelect,
      }),
      database.order.findMany({
        where: { roasterId, status: "SHIPPED" },
        orderBy: { shippedAt: "desc" },
        take: 20,
        select: orderListSelect,
      }),
    ]);

  const countMap = Object.fromEntries(
    statusCounts.map((r) => [r.status, r._count._all])
  ) as Record<string, number>;
  const totalOrders = statusCounts.reduce((s, r) => s + r._count._all, 0);

  return (
    <div className="mt-8 space-y-8">
      <section>
        <h2 className="font-semibold text-lg">Order summary</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          {totalOrders} total · scoped to your roaster
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-muted-foreground text-xs">Awaiting payment</dt>
            <dd className="font-semibold text-2xl tabular-nums">
              {countMap.PENDING ?? 0}
            </dd>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-muted-foreground text-xs">Needs fulfillment</dt>
            <dd className="font-semibold text-2xl tabular-nums">
              {countMap.CONFIRMED ?? 0}
            </dd>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-muted-foreground text-xs">Shipped</dt>
            <dd className="font-semibold text-2xl tabular-nums">
              {countMap.SHIPPED ?? 0}
            </dd>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <dt className="text-muted-foreground text-xs">Delivered</dt>
            <dd className="font-semibold text-2xl tabular-nums">
              {countMap.DELIVERED ?? 0}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="font-semibold text-lg">Needs fulfillment</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Paid orders — add tracking below or use the link in your email.
        </p>
        {needsFulfillment.length === 0 ? (
          <p className="mt-4 text-muted-foreground text-sm">
            No orders awaiting shipment.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {needsFulfillment.map((o) => (
              <li className="space-y-3 p-4" key={o.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <Link
                      className="font-mono font-semibold underline underline-offset-2"
                      href={`/orders/${o.id}`}
                    >
                      {o.orderNumber}
                    </Link>
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      · {o.buyerEmail}
                    </span>
                  </div>
                  <span className="font-medium text-sm tabular-nums">
                    {formatUsd(o.grossAmount)}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {o.campaign.org.application.orgName ?? o.campaign.org.slug} ·{" "}
                  {o.createdAt.toLocaleString()}
                </p>
                <PortalTrackingForm orderId={o.id} orderNumber={o.orderNumber} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg">Awaiting payment</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Checkout started; payment not completed yet.
        </p>
        {pendingPayment.length === 0 ? (
          <p className="mt-4 text-muted-foreground text-sm">None.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {pendingPayment.map((o) => (
              <li className="flex flex-wrap items-center justify-between gap-2 p-4" key={o.id}>
                <div>
                  <Link
                    className="font-mono font-semibold underline underline-offset-2"
                    href={`/orders/${o.id}`}
                  >
                    {o.orderNumber}
                  </Link>
                  <span className="text-muted-foreground text-sm">
                    {" "}
                    · {o.buyerEmail}
                  </span>
                  <p className="text-muted-foreground text-xs">
                    {o.campaign.org.application.orgName ?? o.campaign.org.slug} ·{" "}
                    {o.createdAt.toLocaleString()}
                  </p>
                </div>
                <span className="text-sm tabular-nums">{formatUsd(o.grossAmount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg">Recently shipped</h2>
        {recentShipped.length === 0 ? (
          <p className="mt-4 text-muted-foreground text-sm">None yet.</p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {recentShipped.map((o) => (
              <li className="p-4" key={o.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    className="font-mono font-semibold underline underline-offset-2"
                    href={`/orders/${o.id}`}
                  >
                    {o.orderNumber}
                  </Link>
                  <span className="text-sm tabular-nums">{formatUsd(o.grossAmount)}</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {o.carrier ?? "—"} ·{" "}
                  <span className="font-mono">{o.trackingNumber ?? "—"}</span>
                </p>
                <p className="text-muted-foreground text-xs">
                  Shipped {o.shippedAt?.toLocaleString() ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
