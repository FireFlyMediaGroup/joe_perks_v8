"use server";

import { shipConfirmedOrder } from "@/app/_lib/ship-confirmed-order";

import { requireRoasterId } from "../../products/_lib/require-roaster";

export type SubmitTrackingFromPortalResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitTrackingFromPortal(
  orderId: string,
  trackingNumber: string,
  carrier: string
): Promise<SubmitTrackingFromPortalResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return { ok: false, error: "You must be signed in as a roaster admin." };
  }

  return shipConfirmedOrder({
    roasterId: session.roasterId,
    orderId,
    trackingNumber,
    carrier,
  });
}
