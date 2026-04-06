import type { RoasterOrderDetail } from "../_lib/queries";

const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function OrderOverview({ order }: { readonly order: RoasterOrderDetail }) {
  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;
  const buyerLabel = order.buyer?.name?.trim() || order.shipToName;
  const shippingLines = [
    order.shipToName,
    order.shipToAddress1,
    order.shipToAddress2,
    `${order.shipToCity}, ${order.shipToState} ${order.shipToPostalCode}`,
    order.shipToCountry,
  ].filter(Boolean);

  return (
    <div className="grid gap-6">
      {order.flaggedAt && !order.flagResolvedAt ? (
        <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 dark:border-amber-950 dark:bg-amber-950/20">
          <h2 className="font-semibold text-lg">Fulfillment issue reported</h2>
          <p className="mt-2 text-sm">
            This order is currently flagged, so the portal keeps it in a read-only
            support state until Joe Perks resolves the issue.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Reason</dt>
              <dd className="font-medium">{order.flagReason ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Requested support</dt>
              <dd className="font-medium">{order.resolutionOffered ?? "—"}</dd>
            </div>
            {order.flagNote ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Roaster note</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium">
                  {order.flagNote}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-lg">Order snapshot</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {orgName} · {order.campaign.name}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">Buyer total</p>
            <p className="font-semibold text-lg">{formatUsd(order.grossAmount)}</p>
          </div>
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Buyer</dt>
            <dd className="font-medium">{buyerLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Buyer email</dt>
            <dd className="font-medium">{order.buyerEmail}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Placed</dt>
            <dd className="font-medium">{order.createdAt.toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Fulfill by</dt>
            <dd className="font-medium">{order.fulfillBy.toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold text-lg">Items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div
              className="flex items-start justify-between gap-4 rounded-xl bg-muted/30 p-3"
              key={item.id}
            >
              <div className="min-w-0">
                <p className="font-medium">{item.productName}</p>
                {item.variantDesc ? (
                  <p className="text-muted-foreground text-sm">
                    {item.variantDesc}
                  </p>
                ) : null}
                <p className="text-muted-foreground text-sm">
                  Qty {item.quantity} · {formatUsd(item.unitPrice)} each
                </p>
              </div>
              <p className="shrink-0 font-medium text-sm">
                {formatUsd(item.lineTotal)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product subtotal</span>
            <span>{formatUsd(order.productSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{formatUsd(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total charged</span>
            <span>{formatUsd(order.grossAmount)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold text-lg">Ship-to snapshot</h2>
          <div className="mt-4 space-y-1 text-sm">
            {shippingLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold text-lg">Payout snapshot</h2>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">Total to roaster</p>
              <p className="font-semibold text-3xl">
                {formatUsd(order.roasterTotal)}
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product share</span>
                <span>{formatUsd(order.roasterAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping passthrough</span>
                <span>{formatUsd(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span>{formatUsd(order.platformAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Payout status</span>
                <span className="font-medium">{order.payoutStatus}</span>
              </div>
              {order.payoutEligibleAt ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eligible at</span>
                  <span>{order.payoutEligibleAt.toLocaleString()}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Org contribution (informational)
                </span>
                <span>{formatUsd(order.orgAmount)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {(order.trackingNumber || order.fulfillmentNote || order.shippedAt) &&
      order.status !== "CONFIRMED" ? (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-semibold text-lg">Shipment details</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Carrier</span>
              <span>{order.carrier ?? "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tracking</span>
              <span className="font-mono">{order.trackingNumber ?? "—"}</span>
            </div>
            {order.shippedAt ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Shipped at</span>
                <span>{order.shippedAt.toLocaleString()}</span>
              </div>
            ) : null}
            {order.deliveredAt ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Delivered at</span>
                <span>{order.deliveredAt.toLocaleString()}</span>
              </div>
            ) : null}
            {order.fulfillmentNote ? (
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  Note to buyer
                </p>
                <p className="mt-1 text-sm">{order.fulfillmentNote}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
