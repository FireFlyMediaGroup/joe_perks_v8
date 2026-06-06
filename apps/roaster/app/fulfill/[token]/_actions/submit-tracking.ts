"use server";

import { database } from "@joe-perks/db";

import { shipConfirmedOrder } from "@/app/_lib/ship-confirmed-order";

import { validateFulfillmentToken } from "../_lib/validate-token";

export type SubmitTrackingResult = { ok: true } | { ok: false; error: string };

export async function submitTracking(
  token: string,
  trackingNumber: string,
  carrier: string
): Promise<SubmitTrackingResult> {
  const validated = await validateFulfillmentToken(token);
  if (!validated.ok) {
    return { ok: false, error: "This link is no longer valid." };
  }

  const orderId = validated.orderId;

  const order = await database.order.findFirst({
    where: { id: orderId, status: "CONFIRMED" },
    select: { roasterId: true },
  });
  if (!order) {
    return {
      ok: false,
      error:
        "This order was already shipped or is no longer awaiting fulfillment.",
    };
  }

  // Defense-in-depth: the link's roaster must own the order it points at.
  if (order.roasterId !== validated.roasterId) {
    return { ok: false, error: "This link is no longer valid." };
  }

  return shipConfirmedOrder({
    roasterId: order.roasterId,
    orderId,
    trackingNumber,
    carrier,
    magicLinkToken: token,
  });
}
