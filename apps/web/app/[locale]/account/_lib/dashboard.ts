import type { OrderStatus } from "@joe-perks/db";

export interface BuyerDashboardOrder {
  readonly fundraiserName: string;
  readonly id: string;
  readonly orderNumber: string;
  readonly placedAt: Date;
  readonly status: OrderStatus;
  readonly totalCents: number;
  readonly unitsCount: number;
  readonly impactCents: number;
}

export interface BuyerDashboardSummary {
  readonly orderCount: number;
  readonly totalImpactCents: number;
  readonly totalSpentCents: number;
}

export function buildBuyerDashboardSummary(
  orders: readonly BuyerDashboardOrder[]
): BuyerDashboardSummary {
  return orders.reduce<BuyerDashboardSummary>(
    (summary, order) => ({
      orderCount: summary.orderCount + 1,
      totalImpactCents: summary.totalImpactCents + order.impactCents,
      totalSpentCents: summary.totalSpentCents + order.totalCents,
    }),
    {
      orderCount: 0,
      totalImpactCents: 0,
      totalSpentCents: 0,
    }
  );
}

export function formatBuyerDashboardDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getBuyerOrderStatusCopy(status: OrderStatus): {
  readonly description: string;
  readonly label: string;
  readonly toneClassName: string;
} {
  switch (status) {
    case "PENDING":
      return {
        description: "We're finalizing your payment.",
        label: "Payment processing",
        toneClassName:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
      };
    case "CONFIRMED":
      return {
        description: "Your order is confirmed and queued for fulfillment.",
        label: "Confirmed",
        toneClassName:
          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200",
      };
    case "SHIPPED":
      return {
        description: "Your order is on the way.",
        label: "Shipped",
        toneClassName:
          "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200",
      };
    case "DELIVERED":
      return {
        description: "Your order was delivered.",
        label: "Delivered",
        toneClassName:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
      };
    case "REFUNDED":
      return {
        description: "This order was refunded.",
        label: "Refunded",
        toneClassName:
          "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
      };
    case "CANCELLED":
      return {
        description: "This order was cancelled.",
        label: "Cancelled",
        toneClassName:
          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
      };
    default:
      return {
        description: "Check back soon for another order update.",
        label: status,
        toneClassName:
          "border-border bg-muted text-foreground dark:bg-muted/40 dark:text-foreground",
      };
  }
}
