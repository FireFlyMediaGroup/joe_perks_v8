import type { OrderDetailView } from "@/lib/orders/order-detail-types";
import {
  formatBuyerOrderDate,
  formatBuyerOrderDateTime,
  getBuyerOrderTrackingStateCopy,
  getCarrierTrackingHref,
} from "../_lib/order-detail";

interface OrderDeliveryCardProps {
  readonly order: OrderDetailView;
}

function renderValue(value: string | null): string {
  return value?.trim() ? value : "Not available yet";
}

export function OrderDeliveryCard({ order }: OrderDeliveryCardProps) {
  const trackingState = getBuyerOrderTrackingStateCopy(order);
  const trackingHref = getCarrierTrackingHref(
    order.carrier,
    order.trackingNumber
  );

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-sm">
          Where is it?
        </p>
        <h2 className="font-semibold text-foreground text-xl tracking-tight">
          {trackingState.headline}
        </h2>
        <p className="text-muted-foreground text-sm leading-6 sm:text-base">
          {trackingState.description}
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {trackingHref ? (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 py-3 font-medium text-background text-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href={trackingHref}
            rel="noreferrer"
            target="_blank"
          >
            Track with {order.carrier}
          </a>
        ) : null}

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-muted/60 p-4">
            <dt className="font-medium text-foreground">Carrier</dt>
            <dd className="mt-1 text-muted-foreground leading-6">
              {renderValue(order.carrier)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <dt className="font-medium text-foreground">Tracking number</dt>
            <dd className="mt-1 break-all text-muted-foreground leading-6">
              {renderValue(order.trackingNumber)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <dt className="font-medium text-foreground">Ship-by target</dt>
            <dd className="mt-1 text-muted-foreground leading-6">
              {formatBuyerOrderDate(order.fulfillBy)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 p-4">
            <dt className="font-medium text-foreground">Delivered</dt>
            <dd className="mt-1 text-muted-foreground leading-6">
              {order.deliveredAt
                ? formatBuyerOrderDateTime(order.deliveredAt)
                : "Not delivered yet"}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-muted-foreground text-sm leading-6">
        {order.shippedAt
          ? `Shipped ${formatBuyerOrderDateTime(order.shippedAt)}.`
          : "We will show shipment details here as soon as the roaster sends them."}
      </p>
    </section>
  );
}
