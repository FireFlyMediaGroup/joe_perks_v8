import type { OrderDetailView } from "./order-detail-types";

interface SerializedOrderDetailDates {
  readonly deliveredAt: string | null;
  readonly fulfillBy: string;
  readonly placedAt: string;
  readonly shippedAt: string | null;
}

export type GuestOrderLookupOrderPayload = Omit<
  OrderDetailView,
  keyof SerializedOrderDetailDates
> &
  SerializedOrderDetailDates;

export function normalizeGuestOrderLookupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeGuestOrderLookupOrderNumber(
  orderNumber: string
): string {
  return orderNumber.trim().toUpperCase();
}

export function serializeGuestOrderLookupOrder(
  order: OrderDetailView
): GuestOrderLookupOrderPayload {
  return {
    ...order,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    fulfillBy: order.fulfillBy.toISOString(),
    placedAt: order.placedAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString() ?? null,
  };
}

export function hydrateGuestOrderLookupOrder(
  payload: GuestOrderLookupOrderPayload
): OrderDetailView {
  return {
    ...payload,
    deliveredAt: payload.deliveredAt ? new Date(payload.deliveredAt) : null,
    fulfillBy: new Date(payload.fulfillBy),
    placedAt: new Date(payload.placedAt),
    shippedAt: payload.shippedAt ? new Date(payload.shippedAt) : null,
  };
}
