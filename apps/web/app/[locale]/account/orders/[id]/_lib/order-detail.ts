import type { OrderStatus } from "@joe-perks/db";

const BASE_TONE_CLASS_NAME =
  "border-border bg-muted text-foreground dark:bg-muted/40 dark:text-foreground";

export interface BuyerOrderTrackingStateInput {
  readonly carrier: string | null;
  readonly deliveredAt: Date | null;
  readonly fulfillBy: Date;
  readonly shippedAt: Date | null;
  readonly status: OrderStatus;
  readonly trackingNumber: string | null;
}

export interface BuyerOrderTrackingStateCopy {
  readonly description: string;
  readonly headline: string;
  readonly label: string;
  readonly toneClassName: string;
}

export function formatBuyerOrderDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatBuyerOrderDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function isBuyerOrderDelayed(
  input: Pick<
    BuyerOrderTrackingStateInput,
    "fulfillBy" | "shippedAt" | "status"
  >,
  now = new Date()
): boolean {
  return (
    input.status === "CONFIRMED" &&
    input.shippedAt === null &&
    input.fulfillBy.getTime() < now.getTime()
  );
}

function normalizeCarrierForTrackingLink(carrier: string): string {
  return carrier
    .trim()
    .toUpperCase()
    .replaceAll(/[\s_-]+/g, "");
}

export function getCarrierTrackingHref(
  carrier: string | null,
  trackingNumber: string | null
): string | null {
  const trimmedCarrier = carrier?.trim();
  const trimmedTracking = trackingNumber?.trim();

  if (!(trimmedCarrier && trimmedTracking)) {
    return null;
  }

  const encodedTracking = encodeURIComponent(trimmedTracking);
  const normalizedCarrier = normalizeCarrierForTrackingLink(trimmedCarrier);

  if (
    normalizedCarrier === "USPS" ||
    normalizedCarrier === "UNITEDSTATESPOSTALSERVICE"
  ) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodedTracking}`;
  }

  if (normalizedCarrier === "UPS") {
    return `https://www.ups.com/track?tracknum=${encodedTracking}`;
  }

  if (normalizedCarrier === "FEDEX" || normalizedCarrier === "FEDERALXPRESS") {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodedTracking}`;
  }

  if (normalizedCarrier === "DHL" || normalizedCarrier === "DHLEXPRESS") {
    return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodedTracking}`;
  }

  return null;
}

export function getBuyerOrderTrackingStateCopy(
  input: BuyerOrderTrackingStateInput,
  now = new Date()
): BuyerOrderTrackingStateCopy {
  if (input.status === "REFUNDED") {
    return {
      description:
        "Your payment was refunded to the original payment method. Contact support if you need help finding the refund.",
      headline: "This order was refunded.",
      label: "Refunded",
      toneClassName:
        "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
    };
  }

  if (input.status === "CANCELLED") {
    return {
      description:
        "This order was cancelled before shipment. If you still need coffee, you can place a new order anytime.",
      headline: "This order was cancelled.",
      label: "Cancelled",
      toneClassName:
        "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
    };
  }

  if (input.status === "DELIVERED") {
    return {
      description: input.deliveredAt
        ? `Delivered ${formatBuyerOrderDate(input.deliveredAt)}.`
        : "We marked this order as delivered.",
      headline: "Your order was delivered.",
      label: "Delivered",
      toneClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    };
  }

  if (input.status === "SHIPPED") {
    const hasTrackingLink =
      getCarrierTrackingHref(input.carrier, input.trackingNumber) !== null;

    return {
      description: hasTrackingLink
        ? "Use the direct carrier link below for the latest scan updates."
        : "This order has shipped. Check the tracking details below for the carrier and tracking number.",
      headline: "Your order is on the way.",
      label: "Shipped",
      toneClassName:
        "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200",
    };
  }

  if (isBuyerOrderDelayed(input, now)) {
    return {
      description:
        "The roaster has not shipped this order by the expected ship-by date yet. We will keep following up and email you if there is a bigger delay.",
      headline: "Your order is taking longer than expected to ship.",
      label: "Delayed",
      toneClassName:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    };
  }

  if (input.status === "CONFIRMED") {
    return {
      description: `The roaster is preparing your order now. It should ship by ${formatBuyerOrderDate(input.fulfillBy)}.`,
      headline: "Your order is confirmed.",
      label: "Confirmed",
      toneClassName:
        "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200",
    };
  }

  if (input.status === "PENDING") {
    return {
      description:
        "We are finalizing your payment. Come back to this page if you need another status check.",
      headline: "We're finalizing your payment.",
      label: "Payment processing",
      toneClassName:
        "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    };
  }

  return {
    description: "Check back soon for another order update.",
    headline: "We have your order details ready.",
    label: input.status,
    toneClassName: BASE_TONE_CLASS_NAME,
  };
}
