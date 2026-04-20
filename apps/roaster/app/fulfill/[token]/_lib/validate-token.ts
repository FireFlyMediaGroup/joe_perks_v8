import { database } from "@joe-perks/db";

export type FulfillmentTokenResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      reason: "expired" | "invalid_payload" | "not_found" | "used";
    };

export async function validateFulfillmentToken(
  token: string
): Promise<FulfillmentTokenResult> {
  const link = await database.magicLink.findUnique({
    where: { token },
  });

  if (!link || link.purpose !== "ORDER_FULFILLMENT") {
    return { ok: false, reason: "not_found" };
  }

  if (link.usedAt) {
    return { ok: false, reason: "used" };
  }

  if (link.expiresAt <= new Date()) {
    return { ok: false, reason: "expired" };
  }

  const raw = link.payload as { order_id?: unknown };
  const orderId = typeof raw.order_id === "string" ? raw.order_id : null;
  if (!orderId) {
    return { ok: false, reason: "invalid_payload" };
  }

  return { ok: true, orderId };
}
