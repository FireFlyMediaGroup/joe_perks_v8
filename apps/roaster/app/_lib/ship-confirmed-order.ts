import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import OrderShippedEmail from "@joe-perks/email/templates/order-shipped";
import { createElement } from "react";

export type ShipConfirmedOrderResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Marks a CONFIRMED order SHIPPED with tracking. Optionally consumes a fulfillment
 * magic link in the same transaction (email link flow).
 */
export async function shipConfirmedOrder(input: {
  roasterId: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  magicLinkToken?: string;
}): Promise<ShipConfirmedOrderResult> {
  const trimmedTracking = input.trackingNumber.trim();
  const trimmedCarrier = input.carrier.trim();
  if (!(trimmedTracking && trimmedCarrier)) {
    return { ok: false, error: "Tracking number and carrier are required." };
  }

  const { roasterId, orderId, magicLinkToken } = input;

  try {
    await database.$transaction(async (tx) => {
      if (magicLinkToken) {
        const consumed = await tx.magicLink.updateMany({
          where: {
            token: magicLinkToken,
            purpose: "ORDER_FULFILLMENT",
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date() },
        });

        if (consumed.count !== 1) {
          throw new Error("LINK_CONSUMED");
        }
      }

      const current = await tx.order.findFirst({
        where: { id: orderId, roasterId, status: "CONFIRMED" },
        select: { id: true, roasterId: true },
      });
      if (!current) {
        throw new Error("ORDER_STATE");
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "SHIPPED",
          trackingNumber: trimmedTracking,
          carrier: trimmedCarrier,
          shippedAt: new Date(),
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId,
          eventType: "SHIPPED",
          actorType: "ROASTER",
          actorId: current.roasterId,
          payload: {
            carrier: trimmedCarrier,
            tracking_number: trimmedTracking,
          },
        },
      });
    });
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "LINK_CONSUMED" || code === "ORDER_STATE") {
      return {
        ok: false,
        error:
          "This order was already shipped, is still awaiting payment, or the fulfillment link is no longer valid.",
      };
    }
    console.error("ship-confirmed-order failed", { order_id: orderId });
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const order = await database.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      campaign: {
        include: {
          org: {
            include: {
              application: { select: { orgName: true } },
            },
          },
        },
      },
    },
  });

  if (order?.buyer?.email) {
    const orgName =
      order.campaign.org.application.orgName ?? order.campaign.org.slug;
    try {
      await sendEmail({
        entityId: order.id,
        entityType: "order",
        react: createElement(OrderShippedEmail, {
          buyerName: order.buyer.name ?? "Customer",
          carrier: trimmedCarrier,
          orderNumber: order.orderNumber,
          orgName,
          trackingNumber: trimmedTracking,
        }),
        subject: `Your Joe Perks order ${order.orderNumber} has shipped`,
        template: "order_shipped",
        to: order.buyer.email,
      });
    } catch {
      console.error("order shipped email failed", { order_id: orderId });
    }
  }

  return { ok: true };
}
