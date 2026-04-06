import "server-only";

import { database } from "@joe-perks/db";

export function getRoasterOrderDetail(orderId: string, roasterId: string) {
  return database.order.findFirst({
    where: {
      id: orderId,
      roasterId,
    },
    select: {
      buyer: {
        select: {
          email: true,
          name: true,
        },
      },
      buyerEmail: true,
      campaign: {
        select: {
          name: true,
          org: {
            select: {
              application: {
                select: {
                  orgName: true,
                },
              },
              slug: true,
            },
          },
        },
      },
      carrier: true,
      createdAt: true,
      deliveredAt: true,
      events: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          actorId: true,
          actorType: true,
          createdAt: true,
          eventType: true,
          id: true,
          payload: true,
        },
      },
      flagNote: true,
      flagReason: true,
      flagResolvedAt: true,
      flaggedAt: true,
      fulfillBy: true,
      fulfillmentNote: true,
      grossAmount: true,
      id: true,
      items: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          lineTotal: true,
          productName: true,
          quantity: true,
          unitPrice: true,
          variantDesc: true,
        },
      },
      orderNumber: true,
      orgAmount: true,
      payoutEligibleAt: true,
      payoutStatus: true,
      platformAmount: true,
      productSubtotal: true,
      resolutionOffered: true,
      roasterAmount: true,
      roasterTotal: true,
      shipToAddress1: true,
      shipToAddress2: true,
      shipToCity: true,
      shipToCountry: true,
      shipToName: true,
      shipToPostalCode: true,
      shipToState: true,
      shippedAt: true,
      shippingAmount: true,
      status: true,
      trackingNumber: true,
    },
  });
}

export type RoasterOrderDetail = NonNullable<
  Awaited<ReturnType<typeof getRoasterOrderDetail>>
>;
