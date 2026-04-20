import { formatCentsAsDollars } from "../../../../[slug]/_lib/format";

interface OrderSummaryCardProps {
  readonly fundraiserName: string;
  readonly grossAmount: number;
  readonly orgAmount: number;
  readonly orgPctSnapshot: number;
  readonly productSubtotal: number;
  readonly shippingAmount: number;
}

export function OrderSummaryCard({
  fundraiserName,
  grossAmount,
  orgAmount,
  orgPctSnapshot,
  productSubtotal,
  shippingAmount,
}: OrderSummaryCardProps) {
  const fundraiserPercent = orgPctSnapshot * 100;

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="space-y-2">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">
          Order totals
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          This order raised {formatCentsAsDollars(orgAmount)} for{" "}
          {fundraiserName} at {fundraiserPercent}% of the product subtotal.
        </p>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3">
          <dt className="text-muted-foreground">Products</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {formatCentsAsDollars(productSubtotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {formatCentsAsDollars(shippingAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3">
          <dt className="text-muted-foreground">Fundraiser impact</dt>
          <dd className="font-medium text-foreground tabular-nums">
            {formatCentsAsDollars(orgAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
          <dt className="font-semibold text-foreground">Total paid</dt>
          <dd className="font-semibold text-base text-foreground tabular-nums">
            {formatCentsAsDollars(grossAmount)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
