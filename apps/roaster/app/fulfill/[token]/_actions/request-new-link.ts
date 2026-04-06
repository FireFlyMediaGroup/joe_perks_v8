"use server";

import { database, ensureActiveFulfillmentLink } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import MagicLinkFulfillmentEmail from "@joe-perks/email/templates/magic-link-fulfillment";
import { createElement } from "react";

const ROASTER_APP_ORIGIN_DEFAULT = "http://localhost:3001";
const TRAILING_SLASH = /\/$/;

export type RequestNewLinkResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function normalizeOrigin(origin: string | undefined): string {
  return (origin?.trim() || ROASTER_APP_ORIGIN_DEFAULT).replace(TRAILING_SLASH, "");
}

export async function requestNewFulfillmentLink(
  token: string
): Promise<RequestNewLinkResult> {
  const link = await database.magicLink.findUnique({
    where: { token },
  });

  if (!link || link.purpose !== "ORDER_FULFILLMENT") {
    return {
      ok: false,
      error: "We couldn't verify this fulfillment link. Contact Joe Perks support.",
    };
  }

  if (link.usedAt) {
    return {
      ok: false,
      error: "This order was already marked as shipped.",
    };
  }

  if (link.expiresAt > new Date()) {
    return {
      ok: false,
      error: "This fulfillment link is still active.",
    };
  }

  const raw = link.payload as { order_id?: unknown };
  const orderId = typeof raw.order_id === "string" ? raw.order_id : null;
  if (!orderId) {
    return {
      ok: false,
      error: "We couldn't verify this fulfillment link. Contact Joe Perks support.",
    };
  }

  const order = await database.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      roaster: { select: { email: true } },
    },
  });

  if (!order || order.status !== "CONFIRMED") {
    return {
      ok: false,
      error: "This order is no longer awaiting shipment.",
    };
  }

  const activeLink = await ensureActiveFulfillmentLink({
    expectedToken: token,
    orderId: order.id,
    regenerationReason: "expired_token_recovery",
    requireExpired: true,
  });

  if (!activeLink.ok) {
    return {
      ok: false,
      error: "This fulfillment link is no longer eligible for regeneration.",
    };
  }

  const fulfillUrl = `${normalizeOrigin(process.env.ROASTER_APP_ORIGIN)}/fulfill/${activeLink.token}`;

  try {
    await sendEmail({
      entityId: order.id,
      entityType: "order",
      react: createElement(MagicLinkFulfillmentEmail, {
        fulfillUrl,
        items: order.items.map((item) => ({
          name: item.productName,
          priceInCents: item.unitPrice,
          quantity: item.quantity,
        })),
        orderNumber: order.orderNumber,
        shippingInCents: order.shippingAmount,
        totalInCents: order.grossAmount,
      }),
      subject: `Fresh fulfillment link for order ${order.orderNumber}`,
      template: "magic_link_fulfillment_manual_resend",
      to: order.roaster.email,
    });
  } catch {
    console.error("request new fulfillment link email failed", {
      order_id: order.id,
    });
    return {
      ok: false,
      error: "We regenerated the link but couldn't send the email. Contact Joe Perks support.",
    };
  }

  return {
    ok: true,
    message: `A fresh fulfillment link was sent to the roaster email for order ${order.orderNumber}.`,
  };
}
