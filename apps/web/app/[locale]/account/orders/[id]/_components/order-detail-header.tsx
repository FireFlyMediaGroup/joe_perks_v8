import type { BuyerOrderTrackingStateCopy } from "../_lib/order-detail";
import { formatBuyerOrderDate } from "../_lib/order-detail";

interface OrderDetailHeaderProps {
  readonly fundraiserName: string;
  readonly locale: string;
  readonly orderNumber: string;
  readonly placedAt: Date;
  readonly trackingState: BuyerOrderTrackingStateCopy;
}

export function OrderDetailHeader({
  fundraiserName,
  locale,
  orderNumber,
  placedAt,
  trackingState,
}: OrderDetailHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-semibold text-3xl text-foreground tracking-tight">
          {orderNumber}
        </h1>
        <span
          className={`inline-flex min-h-11 items-center rounded-full border px-3 py-2 font-medium text-sm ${trackingState.toneClassName}`}
        >
          {trackingState.label}
        </span>
      </div>
      <p className="max-w-3xl text-muted-foreground text-sm leading-6 sm:text-base">
        Placed {formatBuyerOrderDate(placedAt, locale)} for{" "}
        <span className="font-medium text-foreground">{fundraiserName}</span>.
      </p>
    </header>
  );
}
