import Link from "next/link";
import { formatCentsAsDollars } from "../../[slug]/_lib/format";
import {
  type BuyerDashboardOrder,
  formatBuyerDashboardDate,
  getBuyerOrderStatusCopy,
} from "../_lib/dashboard";

interface OrderHistoryListProps {
  readonly locale: string;
  readonly orders: readonly BuyerDashboardOrder[];
}

export function OrderHistoryList({ locale, orders }: OrderHistoryListProps) {
  return (
    <section
      aria-labelledby="buyer-order-history-heading"
      className="space-y-4"
    >
      <div className="space-y-2">
        <h2
          className="font-semibold text-foreground text-xl tracking-tight"
          id="buyer-order-history-heading"
        >
          Order history
        </h2>
        <p className="max-w-2xl text-muted-foreground text-sm leading-6">
          Orders are sorted with your newest purchase first, so the latest
          update is always closest to the top.
        </p>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const status = getBuyerOrderStatusCopy(order.status);

          return (
            <article
              className="rounded-2xl border bg-card p-5 shadow-sm"
              key={order.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-base text-foreground sm:text-lg">
                      {order.orderNumber}
                    </p>
                    <span
                      className={`inline-flex min-h-11 items-center rounded-full border px-3 py-2 font-medium text-sm ${status.toneClassName}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-6">
                    Placed {formatBuyerDashboardDate(order.placedAt)} for{" "}
                    <span className="font-medium text-foreground">
                      {order.fundraiserName}
                    </span>
                    .
                  </p>
                  <p className="text-muted-foreground text-sm leading-6">
                    {order.unitsCount} item{order.unitsCount === 1 ? "" : "s"}{" "}
                    in this order.
                  </p>
                </div>

                <div className="space-y-1 text-left sm:text-right">
                  <p className="font-semibold text-foreground text-lg tabular-nums">
                    {formatCentsAsDollars(order.totalCents)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatCentsAsDollars(order.impactCents)} raised for the
                    fundraiser
                  </p>
                </div>
              </div>

              <p className="mt-4 rounded-xl bg-muted/60 px-4 py-3 text-muted-foreground text-sm leading-6">
                {status.description}
              </p>

              <div className="mt-4">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-3 font-medium text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  href={`/${locale}/account/orders/${order.id}`}
                >
                  View order details
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
