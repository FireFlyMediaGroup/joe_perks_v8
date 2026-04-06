"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";

import {
  normalizeShipmentInputs,
  sendBuyerShipmentEmail,
  shipConfirmedOrder,
} from "@/app/_lib/order-shipping";
import { requireRoasterId } from "../../../products/_lib/require-roaster";

export type ShipOrderResult = { ok: true } | { ok: false; error: string };

export async function shipOrder(
  orderId: string,
  trackingNumber: string,
  carrier: string,
  fulfillmentNote = ""
): Promise<ShipOrderResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { ok: false, error: "Not authorized." };
  }

  const normalized = normalizeShipmentInputs({
    carrier,
    fulfillmentNote,
    trackingNumber,
  });
  if (!normalized.ok) {
    return { ok: false, error: normalized.error };
  }

  try {
    await database.$transaction(async (tx) => {
      const shipped = await shipConfirmedOrder(tx, {
        orderId,
        roasterId: session.roasterId,
        ...normalized.value,
      });

      if (!shipped.ok) {
        throw new Error("ORDER_STATE");
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_STATE") {
      return {
        ok: false,
        error: "This order is no longer awaiting fulfillment.",
      };
    }

    console.error("ship-order failed", {
      order_id: orderId,
      roaster_id: session.roasterId,
    });
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

  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);

  return { ok: true };
}
