import "server-only";

import { database } from "@joe-perks/db";
import { readBuyerSession } from "@/lib/buyer-auth/session";
import type { ShippingFormValues } from "./schema";
import { buildShippingPrefillFromOrderSnapshot } from "./buyer-prefill";

export interface CheckoutBuyerContext {
  buyerEmail: string;
  hasPrefill: boolean;
  shippingPrefill: ShippingFormValues | null;
}

export async function getCheckoutBuyerContext(
  defaultShippingRateId: string | null
): Promise<CheckoutBuyerContext | null> {
  const session = await readBuyerSession();
  if (!session) {
    return null;
  }

  const buyer = await database.buyer.findUnique({
    where: { id: session.buyerId },
    select: {
      email: true,
      id: true,
    },
  });
  if (!buyer) {
    return null;
  }

  const latestOrder = await database.order.findFirst({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: "desc" },
    select: {
      buyerEmail: true,
      shipToAddress1: true,
      shipToAddress2: true,
      shipToCity: true,
      shipToCountry: true,
      shipToName: true,
      shipToPostalCode: true,
      shipToState: true,
    },
  });

  const shippingPrefill = latestOrder
    ? buildShippingPrefillFromOrderSnapshot({
        defaultShippingRateId,
        order: latestOrder,
      })
    : null;

  return {
    buyerEmail: buyer.email,
    hasPrefill: shippingPrefill !== null,
    shippingPrefill,
  };
}
