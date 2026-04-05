import "server-only";

import { database } from "@joe-perks/db";
import type { OrderDetailView } from "@/lib/orders/order-detail-types";

interface GetGuestOrderLookupDetailInput {
  readonly buyerEmail: string;
  readonly orderNumber: string;
}

export async function getGuestOrderLookupDetail({
  buyerEmail,
  orderNumber,
}: GetGuestOrderLookupDetailInput): Promise<OrderDetailView | null> {
  const order = await database.order.findFirst({
    where: {
      buyerEmail: {
        equals: buyerEmail,
        mode: "insensitive",
      },
      orderNumber,
    },
    select: {
      buyerEmail: true,
      carrier: true,
      createdAt: true,
      deliveredAt: true,
      fulfillBy: true,
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
      orgPctSnapshot: true,
      productSubtotal: true,
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
      campaign: {
        select: {
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
    },
  });

  if (!order) {
    return null;
  }

  return {
    buyerEmail: order.buyerEmail,
    carrier: order.carrier,
    deliveredAt: order.deliveredAt,
    fulfillBy: order.fulfillBy,
    fundraiserName: order.campaign.org.application.orgName ?? order.campaign.org.slug,
    grossAmount: order.grossAmount,
    id: order.id,
    items: order.items,
    orderNumber: order.orderNumber,
    orgAmount: order.orgAmount,
    orgPctSnapshot: order.orgPctSnapshot,
    placedAt: order.createdAt,
    productSubtotal: order.productSubtotal,
    shipToAddress1: order.shipToAddress1,
    shipToAddress2: order.shipToAddress2,
    shipToCity: order.shipToCity,
    shipToCountry: order.shipToCountry,
    shipToName: order.shipToName,
    shipToPostalCode: order.shipToPostalCode,
    shipToState: order.shipToState,
    shippedAt: order.shippedAt,
    shippingAmount: order.shippingAmount,
    status: order.status,
    trackingNumber: order.trackingNumber,
  };
}
