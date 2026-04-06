"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";

import {
  normalizeShipmentInputs,
  sendBuyerShipmentEmail,
  updateShipmentTracking,
} from "@/app/_lib/order-shipping";
import { requireRoasterId } from "../../../products/_lib/require-roaster";

export type UpdateTrackingResult = { ok: true } | { ok: false; error: string };

export async function updateTracking(
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<UpdateTrackingResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { ok: false, error: "Not authorized." };
  }

  const normalized = normalizeShipmentInputs({
    carrier,
    trackingNumber,
  });
  if (!normalized.ok) {
    return { ok: false, error: normalized.error };
  }

  let eventId: string | null = null;
  let fulfillmentNote: string | null = null;

  try {
    await database.$transaction(async (tx) => {
      const updated = await updateShipmentTracking(tx, {
        carrier: normalized.value.carrier,
        orderId,
        roasterId: session.roasterId,
        trackingNumber: normalized.value.trackingNumber,
      });

      if (!updated.ok) {
        throw new Error(updated.error);
      }

      eventId = updated.eventId;
      fulfillmentNote = updated.fulfillmentNote;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_CHANGE") {
      return {
        ok: false,
        error: "Update the carrier or tracking number before saving.",
      };
    }

    if (error instanceof Error && error.message === "ORDER_STATE") {
      return {
        ok: false,
        error: "Tracking can only be corrected for shipped orders you own.",
      };
    }

    console.error("update-tracking failed", {
      order_id: orderId,
      roaster_id: session.roasterId,
    });
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  if (eventId) {
    try {
      await sendBuyerShipmentEmail({
        carrier: normalized.value.carrier,
        entityId: eventId,
        entityType: "order_event",
        fulfillmentNote,
        kind: "tracking-updated",
        orderId,
        trackingNumber: normalized.value.trackingNumber,
      });
    } catch {
      console.error("tracking update email failed", { order_id: orderId });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath(`/orders/${orderId}`);

  return { ok: true };
}
