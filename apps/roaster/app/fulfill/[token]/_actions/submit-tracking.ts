"use server";

import { database } from "@joe-perks/db";
import {
  normalizeShipmentInputs,
  sendBuyerShipmentEmail,
  shipConfirmedOrder,
} from "@/app/_lib/order-shipping";

import { validateFulfillmentToken } from "../_lib/validate-token";

export type SubmitTrackingResult = { ok: true } | { ok: false; error: string };

export async function submitTracking(
  token: string,
  trackingNumber: string,
  carrier: string,
  fulfillmentNote = ""
): Promise<SubmitTrackingResult> {
  const normalized = normalizeShipmentInputs({
    carrier,
    fulfillmentNote,
    trackingNumber,
  });
  if (!normalized.ok) {
    return { ok: false, error: normalized.error };
  }

  const validated = await validateFulfillmentToken(token);
  if (!validated.ok) {
    return { ok: false, error: "This link is no longer valid." };
  }

  const orderId = validated.orderId;

  try {
    await database.$transaction(async (tx) => {
      const consumed = await tx.magicLink.updateMany({
        where: {
          token,
          purpose: "ORDER_FULFILLMENT",
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
      });

      if (consumed.count !== 1) {
        throw new Error("LINK_CONSUMED");
      }

      const shipped = await shipConfirmedOrder(tx, {
        orderId,
        ...normalized.value,
      });
      if (!shipped.ok) {
        throw new Error("ORDER_STATE");
      }
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "LINK_CONSUMED" || code === "ORDER_STATE") {
      return {
        ok: false,
        error: "This order was already shipped or the link is no longer valid.",
      };
    }
    console.error("submit-tracking failed", { order_id: orderId });
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  try {
    await sendBuyerShipmentEmail({
      carrier: normalized.value.carrier,
      entityId: orderId,
      entityType: "order",
      fulfillmentNote: normalized.value.fulfillmentNote,
      kind: "initial",
      orderId,
      trackingNumber: normalized.value.trackingNumber,
    });
  } catch {
    console.error("order shipped email failed", { order_id: orderId });
  }

  return { ok: true };
}
