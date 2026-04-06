"use server";

import { database } from "@joe-perks/db";
import { getAdminActorLabel } from "@joe-perks/types";
import { revalidatePath } from "next/cache";

export type ResolveFlagResult = { ok: true } | { ok: false; error: string };

export async function resolveFlag(orderId: string): Promise<ResolveFlagResult> {
  const actorId = getAdminActorLabel();

  const order = await database.order.findUnique({
    select: {
      flagNote: true,
      flagReason: true,
      flagResolvedAt: true,
      flaggedAt: true,
      resolutionOffered: true,
      roasterId: true,
    },
    where: { id: orderId },
  });

  if (!order?.flaggedAt || order.flagResolvedAt) {
    return { ok: false, error: "This order does not have an unresolved flag." };
  }

  const resolvedAt = new Date();

  await database.$transaction([
    database.order.update({
      where: { id: orderId },
      data: {
        adminAcknowledgedFlag: true,
        flagResolvedAt: resolvedAt,
      },
    }),
    database.orderEvent.create({
      data: {
        orderId,
        eventType: "FLAG_RESOLVED",
        actorType: "ADMIN",
        actorId,
        payload: {
          flag_note: order.flagNote,
          flag_reason: order.flagReason,
          resolution_offered: order.resolutionOffered,
        },
      },
    }),
  ]);

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}
