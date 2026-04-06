import type { ActorType, OrderEventType } from "@joe-perks/db";

const eventLabels: Record<OrderEventType, string> = {
  CANCELLED: "Cancelled",
  DELIVERED: "Delivered",
  DISPUTE_CLOSED: "Dispute closed",
  DISPUTE_OPENED: "Dispute opened",
  FLAG_RESOLVED: "Issue resolved",
  FULFILLMENT_VIEWED: "Fulfillment link opened",
  MAGIC_LINK_RESENT: "Fulfillment link resent",
  NOTE_ADDED: "Internal note added",
  ORDER_CONFIRMED: "Order confirmed",
  ORDER_CREATED: "Order created",
  ORDER_FLAGGED: "Issue reported",
  PAYMENT_FAILED: "Payment failed",
  PAYMENT_INTENT_CREATED: "Payment started",
  PAYMENT_SUCCEEDED: "Order confirmed",
  PAYOUT_FAILED: "Payout failed",
  PAYOUT_TRANSFERRED: "Payout transferred",
  REFUND_COMPLETED: "Refund completed",
  REFUND_INITIATED: "Refund initiated",
  SHIPPED: "Marked as shipped",
  SLA_BREACH: "SLA breach",
  SLA_WARNING: "SLA warning",
  TRACKING_UPDATED: "Tracking updated",
};

export function getRoasterOrderEventLabel(eventType: OrderEventType): string {
  return eventLabels[eventType] ?? eventType;
}

export function getOrderEventActorLabel(actorType: ActorType): string {
  switch (actorType) {
    case "ADMIN": {
      return "Joe Perks";
    }
    case "BUYER": {
      return "Buyer";
    }
    case "ORG": {
      return "Organization";
    }
    case "ROASTER": {
      return "Roaster";
    }
    case "SYSTEM": {
      return "System";
    }
    default: {
      return actorType;
    }
  }
}

export function getOrderEventDetail(
  eventType: OrderEventType,
  payload: unknown
): string | null {
  if (!(payload && typeof payload === "object")) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (eventType === "SHIPPED" || eventType === "TRACKING_UPDATED") {
    const carrier = readString(record.carrier);
    const trackingNumber = readString(record.tracking_number);
    if (carrier && trackingNumber) {
      return `${carrier} · ${trackingNumber}`;
    }
    if (trackingNumber) {
      return trackingNumber;
    }
  }

  if (eventType === "ORDER_FLAGGED") {
    const reason = readString(record.reason);
    if (reason) {
      return reason;
    }
  }

  if (eventType === "FLAG_RESOLVED") {
    const resolution = readString(record.resolution);
    if (resolution) {
      return resolution;
    }
  }

  return null;
}

function readString(value: Record<string, unknown>[string]): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
