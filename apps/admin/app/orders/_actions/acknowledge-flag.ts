"use server";

import { database } from "@joe-perks/db";
import { revalidatePath } from "next/cache";

export type AcknowledgeFlagResult = { ok: true } | { ok: false; error: string };

export async function acknowledgeFlag(
  orderId: string
): Promise<AcknowledgeFlagResult> {
  const order = await database.order.findUnique({
    select: {
      adminAcknowledgedFlag: true,
      flagResolvedAt: true,
      flaggedAt: true,
      id: true,
    },
    where: { id: orderId },
  });

  if (!order?.flaggedAt || order.flagResolvedAt) {
    return { ok: false, error: "This order does not have an unresolved flag." };
  }

  if (order.adminAcknowledgedFlag) {
    return { ok: true };
  }

  await database.order.update({
    where: { id: orderId },
    data: { adminAcknowledgedFlag: true },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}
