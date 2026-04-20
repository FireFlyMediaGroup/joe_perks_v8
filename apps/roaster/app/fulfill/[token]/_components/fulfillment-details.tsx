interface FulfillmentOrder {
  buyer: { name: string | null } | null;
  campaign: {
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
    variantDesc: string;
  }>;
  orderNumber: string;
  orgAmount: number;
  roasterAmount: number;
  roasterTotal: number;
  shippingAmount: number;
  status: string;
}

const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function FulfillmentDetails({ order }: { order: FulfillmentOrder }) {
  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;
  const subtotal = order.items.reduce((s, i) => s + i.lineTotal, 0);
  const buyerLabel = order.buyer?.name?.trim() || "Customer";
  const orderDate = order.createdAt.toLocaleDateString();

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-muted-foreground text-sm">
          Order {order.orderNumber}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-2xl">Fulfill this order</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 text-xs dark:bg-amber-950 dark:text-amber-100">
            {order.status}
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Ship to label: <span className="text-foreground">{buyerLabel}</span>
        </p>
        <p className="text-muted-foreground text-sm">Order date: {orderDate}</p>
        <p className="text-muted-foreground text-sm">Fundraiser: {orgName}</p>
      </header>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Each</th>
              <th className="px-3 py-2 font-medium">Line</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr className="border-t" key={item.id}>
                <td className="px-3 py-2">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-muted-foreground text-xs">
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

      <div className="grid gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatUsd(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping (pass-through)</span>
          <span>{formatUsd(order.shippingAmount)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Buyer total</span>
          <span>{formatUsd(order.grossAmount)}</span>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 font-semibold text-sm">Your payout (frozen)</h3>
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
      </div>
    </section>
  );
}
