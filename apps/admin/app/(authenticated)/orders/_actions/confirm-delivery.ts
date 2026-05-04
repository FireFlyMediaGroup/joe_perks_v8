"use server";

import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import OrderDeliveredEmail from "@joe-perks/email/templates/order-delivered";
import { revalidatePath } from "next/cache";
import { createElement } from "react";

import { requirePlatformAdmin } from "../../_lib/require-platform-admin";

export type ConfirmDeliveryResult = { ok: true } | { ok: false; error: string };

export async function confirmDelivery(
  orderId: string
): Promise<ConfirmDeliveryResult> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) {
    return {
      ok: false,
      error: "You are not authorized to confirm delivery.",
    };
  }

  const adminActorId = admin.admin.actorLabel;
  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  const now = new Date();
  const payoutEligibleAt = new Date(
    now.getTime() + settings.payoutHoldDays * 24 * 60 * 60 * 1000
  );

  const order = await database.order.findFirst({
    where: { id: orderId, status: "SHIPPED" },
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

  if (!order) {
    return {
      ok: false,
      error: "Order not found or not awaiting delivery confirmation.",
    };
  }

  try {
    await database.$transaction([
      database.order.update({
        where: { id: orderId, status: "SHIPPED" },
        data: {
          status: "DELIVERED",
          deliveredAt: now,
          payoutEligibleAt,
        },
      }),
      // OrderEvent must stay in this transaction with the delivery update.
      database.orderEvent.create({
        data: {
          orderId,
          eventType: "DELIVERED",
          actorType: "ADMIN",
          actorId: adminActorId,
          payload: {},
        },
      }),
    ]);
  } catch {
    return { ok: false, error: "Could not update order. Try again." };
  }

  if (order.buyer?.email) {
    const orgName =
      order.campaign.org.application.orgName ?? order.campaign.org.slug;
    try {
      await sendEmail({
        entityId: order.id,
        entityType: "order",
        react: createElement(OrderDeliveredEmail, {
          buyerName: order.buyer.name ?? "Customer",
          orderNumber: order.orderNumber,
          orgAmountInCents: order.orgAmount,
          orgName,
          orgPctSnapshot: order.orgPctSnapshot,
        }),
        subject: `Delivered — thanks for supporting your community (${order.orderNumber})`,
        template: "order_delivered",
        to: order.buyer.email,
      });
    } catch {
      console.error("delivered email failed", { order_id: orderId });
    }
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true };
}
