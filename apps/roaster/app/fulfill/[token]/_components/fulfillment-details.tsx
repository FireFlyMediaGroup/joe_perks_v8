interface FulfillmentOrder {
  buyer: { name: string | null } | null;
  campaign: {
    name: string;
    org: {
      application: { orgName: string | null };
      slug: string;
    };
  };
  createdAt: Date;
  grossAmount: number;
  items: Array<{
    id: string;
    lineTotal: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    variantDesc: string | null;
  }>;
  orderNumber: string;
  orgAmount: number;
  roasterAmount: number;
  roasterTotal: number;
  shipToAddress1: string;
  shipToAddress2: string | null;
  shipToCity: string;
  shipToCountry: string;
  shipToName: string;
  shipToPostalCode: string;
  shipToState: string;
  shippingAmount: number;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: Date | null;
  fulfillmentNote: string | null;
}

const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function FulfillmentDetails({ order }: { order: FulfillmentOrder }) {
  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;
  const subtotal = order.items.reduce((s, i) => s + i.lineTotal, 0);
  const buyerLabel = order.buyer?.name?.trim() || order.shipToName;
  const orderDate = order.createdAt.toLocaleDateString();
  const shippedDate = order.shippedAt?.toLocaleString();
  const shippingLines = [
    order.shipToName,
    order.shipToAddress1,
    order.shipToAddress2,
    `${order.shipToCity}, ${order.shipToState} ${order.shipToPostalCode}`,
    order.shipToCountry,
  ].filter(Boolean);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">
          Fulfillment link
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-semibold text-3xl">{order.orderNumber}</h1>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-100">
            {order.status}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          {orgName} · {order.campaign.name}
        </p>
        <p className="text-muted-foreground text-sm">Ship-to contact: {buyerLabel}</p>
        <p className="text-muted-foreground text-sm">Order date: {orderDate}</p>
      </header>

      <section className="rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-lg">Order summary</h2>
          <span className="text-muted-foreground text-sm">
            Buyer total {formatUsd(order.grossAmount)}
          </span>
        </div>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              className="flex items-start justify-between gap-4 rounded-lg bg-muted/30 p-3"
              key={item.id}
            >
              <div className="min-w-0">
                <div className="font-medium">{item.productName}</div>
                {item.variantDesc ? (
                  <div className="text-muted-foreground text-sm">
                    {item.variantDesc}
                  </div>
                ) : null}
                <div className="text-muted-foreground text-sm">
                  Qty {item.quantity} · {formatUsd(item.unitPrice)} each
                </div>
              </div>
              <div className="shrink-0 font-medium text-sm">
                {formatUsd(item.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product subtotal</span>
            <span>{formatUsd(subtotal)}</span>
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

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold text-lg">Ship-to snapshot</h2>
        <div className="mt-4 space-y-1 text-sm">
          {shippingLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-muted/30 p-5">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Your payout (frozen)</p>
          <p className="font-semibold text-3xl">{formatUsd(order.roasterTotal)}</p>
        </div>
        <div className="grid gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product share</span>
            <span>{formatUsd(order.roasterAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping passthrough</span>
            <span>{formatUsd(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total to roaster</span>
            <span>{formatUsd(order.roasterTotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-muted-foreground">
            <span>Org contribution (informational)</span>
            <span>{formatUsd(order.orgAmount)}</span>
          </div>
        </div>
      </section>

      {order.trackingNumber && order.carrier ? (
        <section className="rounded-xl border p-5">
          <h2 className="font-semibold text-lg">Shipment details</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Carrier</span>
              <span>{order.carrier}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Tracking</span>
              <span className="font-mono">{order.trackingNumber}</span>
            </div>
            {shippedDate ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Shipped at</span>
                <span>{shippedDate}</span>
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
    </section>
  );
}
