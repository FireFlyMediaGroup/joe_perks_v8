import "server-only";

import { database } from "@joe-perks/db";
import type { BuyerDashboardOrder } from "./dashboard";

export async function getBuyerDashboardOrders(
  buyerId: string
): Promise<BuyerDashboardOrder[]> {
  const orders = await database.order.findMany({
    where: { buyerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      campaign: {
        select: {
          org: {
            select: {
              application: {
                select: { orgName: true },
              },
              slug: true,
            },
          },
        },
      },
      createdAt: true,
      grossAmount: true,
      id: true,
      items: {
        select: {
          quantity: true,
        },
      },
      orderNumber: true,
      orgAmount: true,
      status: true,
    },
  });

  return orders.map((order) => ({
    fundraiserName:
      order.campaign.org.application.orgName ?? order.campaign.org.slug,
    id: order.id,
    impactCents: order.orgAmount,
    orderNumber: order.orderNumber,
    placedAt: order.createdAt,
    status: order.status,
    totalCents: order.grossAmount,
    unitsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));
}
