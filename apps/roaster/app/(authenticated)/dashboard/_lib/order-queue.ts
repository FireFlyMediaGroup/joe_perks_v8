import type { OrderStatus } from "@joe-perks/db";

export const orderQueueViews = [
  "to-ship",
  "shipped",
  "delivered",
  "all",
] as const;

export type OrderQueueView = (typeof orderQueueViews)[number];

interface OrderTimingInput {
  readonly deliveredAt: Date | null;
  readonly fulfillBy: Date;
  readonly shippedAt: Date | null;
  readonly status: OrderStatus;
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function parseOrderQueueView(
  value: string | undefined
): OrderQueueView {
  return orderQueueViews.includes(value as OrderQueueView)
    ? (value as OrderQueueView)
    : "to-ship";
}

export function getOrderQueueViewLabel(view: OrderQueueView): string {
  switch (view) {
    case "to-ship": {
      return "To ship";
    }
    case "shipped": {
      return "Shipped";
    }
    case "delivered": {
      return "Delivered";
    }
    case "all": {
      return "All";
    }
    default: {
      return "To ship";
    }
  }
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING": {
      return "Pending";
    }
    case "CONFIRMED": {
      return "Confirmed";
    }
    case "SHIPPED": {
      return "Shipped";
    }
    case "DELIVERED": {
      return "Delivered";
    }
    case "REFUNDED": {
      return "Refunded";
    }
    case "CANCELLED": {
      return "Cancelled";
    }
    default: {
      return "Pending";
    }
  }
}

export function getOrderStatusBadgeVariant(
  status: OrderStatus
): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case "SHIPPED": {
      return "default";
    }
    case "DELIVERED": {
      return "outline";
    }
    case "REFUNDED":
    case "CANCELLED": {
      return "destructive";
    }
    case "PENDING":
    case "CONFIRMED": {
      return "secondary";
    }
    default: {
      return "secondary";
    }
  }
}

export function formatShortDate(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return shortDateFormatter.format(value);
}

export function getOrderTimingLabel(
  order: OrderTimingInput,
  now = new Date()
): string {
  if (order.status === "DELIVERED") {
    return `Delivered ${formatShortDate(order.deliveredAt) ?? "recently"}`;
  }

  if (order.status === "SHIPPED") {
    return `Shipped ${formatShortDate(order.shippedAt) ?? "recently"}`;
  }

  const today = startOfDay(now);
  const dueDate = startOfDay(order.fulfillBy);
  const diffInDays = Math.round(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 0) {
    return `Overdue since ${formatShortDate(order.fulfillBy)}`;
  }

  if (diffInDays === 0) {
    return "Ship today";
  }

  if (diffInDays === 1) {
    return "Ship tomorrow";
  }

  return `Ship by ${formatShortDate(order.fulfillBy)}`;
}

export function getQueueHeading(view: OrderQueueView): string {
  switch (view) {
    case "to-ship": {
      return "What needs to ship next";
    }
    case "shipped": {
      return "Recently shipped orders";
    }
    case "delivered": {
      return "Delivered orders";
    }
    case "all": {
      return "Full order history";
    }
    default: {
      return "What needs to ship next";
    }
  }
}

export function getQueueEmptyStateCopy(view: OrderQueueView): string {
  switch (view) {
    case "to-ship": {
      return "No confirmed orders are waiting to ship right now.";
    }
    case "shipped": {
      return "No orders are currently marked as shipped.";
    }
    case "delivered": {
      return "No delivered orders yet.";
    }
    case "all": {
      return "Orders will appear here once this roaster starts receiving storefront purchases.";
    }
    default: {
      return "No confirmed orders are waiting to ship right now.";
    }
  }
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
