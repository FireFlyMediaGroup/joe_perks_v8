"use server";

import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import OrderShippedEmail from "@joe-perks/email/templates/order-shipped";
import { createElement } from "react";

import { validateFulfillmentToken } from "../_lib/validate-token";

export type SubmitTrackingResult = { ok: true } | { ok: false; error: string };

export async function submitTracking(
  token: string,
  trackingNumber: string,
  carrier: string
): Promise<SubmitTrackingResult> {
  const trimmedTracking = trackingNumber.trim();
  const trimmedCarrier = carrier.trim();
  if (!(trimmedTracking && trimmedCarrier)) {
    return { ok: false, error: "Tracking number and carrier are required." };
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

      const current = await tx.order.findFirst({
        where: { id: orderId, status: "CONFIRMED" },
        select: { roasterId: true },
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

      // OrderEvent must stay in this transaction with ship + link consumption.
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
        error: "This order was already shipped or the link is no longer valid.",
      };
    }
    console.error("submit-tracking failed", { order_id: orderId });
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
