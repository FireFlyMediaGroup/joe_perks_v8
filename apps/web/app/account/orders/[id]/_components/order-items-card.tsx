import type { OrderDetailItem } from "@/lib/orders/order-detail-types";
import { formatCentsAsDollars } from "../../../../[slug]/_lib/format";

interface OrderItemsCardProps {
  readonly items: readonly OrderDetailItem[];
}

export function OrderItemsCard({ items }: OrderItemsCardProps) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="space-y-2">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">
          What did I order?
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          These item names and prices are frozen from the time you placed the
          order.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article className="rounded-2xl bg-muted/60 p-4" key={item.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">
                  {item.productName}
                </h3>
                <p className="text-muted-foreground text-sm leading-6">
                  {item.variantDesc}
                </p>
                <p className="text-muted-foreground text-sm">
                  Quantity: {item.quantity}
                </p>
              </div>

              <div className="space-y-1 text-left sm:text-right">
                <p className="font-semibold text-base text-foreground tabular-nums">
                  {formatCentsAsDollars(item.lineTotal)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {formatCentsAsDollars(item.unitPrice)} each
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
