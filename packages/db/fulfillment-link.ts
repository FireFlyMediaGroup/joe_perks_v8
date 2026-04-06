import crypto from "node:crypto";

import { database } from "./database";

const FULFILLMENT_LINK_TTL_MS = 72 * 60 * 60 * 1000;

function getFulfillmentLinkDedupeKey(orderId: string): string {
  return `order_fulfillment:${orderId}`;
}

interface EnsureActiveFulfillmentLinkInput {
  expectedToken?: string;
  orderId: string;
  regenerationReason: string;
  requireExpired?: boolean;
}

type EnsureActiveFulfillmentLinkResult =
  | { ok: true; regenerated: boolean; token: string }
  | { ok: false; reason: "invalid" | "not_expired" | "not_pending" | "used" };

export async function ensureActiveFulfillmentLink(
  input: EnsureActiveFulfillmentLinkInput
): Promise<EnsureActiveFulfillmentLinkResult> {
  const now = new Date();
  const link = await database.magicLink.findUnique({
    where: {
      dedupeKey: getFulfillmentLinkDedupeKey(input.orderId),
    },
  });

  if (!link || link.purpose !== "ORDER_FULFILLMENT") {
    return { ok: false, reason: "invalid" };
  }

  if (input.expectedToken && link.token !== input.expectedToken) {
    return { ok: false, reason: "invalid" };
  }

  if (link.usedAt) {
    return { ok: false, reason: "used" };
  }

  if (link.expiresAt > now) {
    if (input.requireExpired) {
      return { ok: false, reason: "not_expired" };
    }

    return {
      ok: true,
      regenerated: false,
      token: link.token,
    };
  }

  const order = await database.order.findUnique({
    select: {
      id: true,
      status: true,
    },
    where: {
      id: input.orderId,
    },
  });

  if (!order || order.status !== "CONFIRMED") {
    return { ok: false, reason: "not_pending" };
  }

  const nextToken = crypto.randomBytes(32).toString("hex");
  const nextExpiresAt = new Date(Date.now() + FULFILLMENT_LINK_TTL_MS);

  const regenerated = await database.$transaction(async (tx) => {
    const updated = await tx.magicLink.updateMany({
      where: {
        expiresAt: { lte: now },
        id: link.id,
        purpose: "ORDER_FULFILLMENT",
        token: link.token,
        usedAt: null,
      },
      data: {
        expiresAt: nextExpiresAt,
        token: nextToken,
      },
    });

    if (updated.count !== 1) {
      return null;
    }

    await tx.orderEvent.create({
      data: {
        actorType: "SYSTEM",
        eventType: "MAGIC_LINK_RESENT",
        orderId: input.orderId,
        payload: {
          reason: input.regenerationReason,
        },
      },
    });

    return {
      regenerated: true,
      token: nextToken,
    };
  });

  if (regenerated) {
    return {
      ok: true,
      regenerated: true,
      token: regenerated.token,
    };
  }

  const refreshed = await database.magicLink.findUnique({
    where: {
      dedupeKey: getFulfillmentLinkDedupeKey(input.orderId),
    },
  });

  if (
    refreshed &&
    refreshed.purpose === "ORDER_FULFILLMENT" &&
    !refreshed.usedAt &&
    refreshed.expiresAt > new Date()
  ) {
    return {
      ok: true,
      regenerated: false,
      token: refreshed.token,
    };
  }

  return { ok: false, reason: "invalid" };
}
