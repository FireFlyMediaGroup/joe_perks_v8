import {
  database,
  getSuspensionReasonCategoryFromAction,
  getSuspensionReasonLabel,
} from "@joe-perks/db";
import type { OrderStatus, RoasterStatus, StripeOnboardingStatus } from "@joe-perks/db";

import type { OrderQueueView } from "./order-queue";

export interface DashboardOrderRow {
  readonly buyer: { readonly name: string | null } | null;
  readonly campaign: {
    readonly name: string;
    readonly org: {
      readonly application: { readonly orgName: string | null };
    };
  };
  readonly createdAt: Date;
  readonly deliveredAt: Date | null;
  readonly flagReason: string | null;
  readonly flagResolvedAt: Date | null;
  readonly flaggedAt: Date | null;
  readonly fulfillBy: Date;
  readonly id: string;
  readonly orderNumber: string;
  readonly shipToCity: string;
  readonly shipToName: string;
  readonly shipToState: string;
  readonly shippedAt: Date | null;
  readonly status: OrderStatus;
  readonly trackingNumber: string | null;
}

export interface DashboardCounts {
  readonly all: number;
  readonly delivered: number;
  readonly flagged: number;
  readonly shipped: number;
  readonly toShip: number;
}

export interface DashboardAccountStatus {
  readonly businessName: string;
  readonly chargesEnabled: boolean;
  readonly latestRequestAt: Date | null;
  readonly payoutsEnabled: boolean;
  readonly status: RoasterStatus;
  readonly stripeOnboarding: StripeOnboardingStatus;
  readonly suspensionReason: string | null;
}

export interface RoasterDashboardData {
  readonly account: DashboardAccountStatus;
  readonly counts: DashboardCounts;
  readonly orders: DashboardOrderRow[];
}

const orderSelect = {
  buyer: { select: { name: true } },
  campaign: {
    select: {
      name: true,
      org: {
        select: {
          application: {
            select: { orgName: true },
          },
        },
      },
    },
  },
  createdAt: true,
  deliveredAt: true,
  flagReason: true,
  flagResolvedAt: true,
  flaggedAt: true,
  fulfillBy: true,
  id: true,
  orderNumber: true,
  shipToCity: true,
  shipToName: true,
  shipToState: true,
  shippedAt: true,
  status: true,
  trackingNumber: true,
} as const;

export async function getRoasterDashboardData(
  roasterId: string,
  view: OrderQueueView
): Promise<RoasterDashboardData> {
  const [roaster, counts, orders] = await Promise.all([
    database.roaster.findUnique({
      where: { id: roasterId },
      select: {
        application: {
          select: { businessName: true },
        },
        chargesEnabled: true,
        email: true,
        payoutsEnabled: true,
        status: true,
        stripeOnboarding: true,
      },
    }),
    getDashboardCounts(roasterId),
    getDashboardOrders(roasterId, view),
  ]);

  if (!roaster) {
    throw new Error(`Roaster ${roasterId} not found`);
  }

  const [latestSuspension, latestRequest] =
    roaster.status === "SUSPENDED"
      ? await Promise.all([
          database.adminActionLog.findFirst({
            orderBy: { createdAt: "desc" },
            where: {
              actionType: {
                in: ["ROASTER_AUTO_SUSPENDED", "ROASTER_SUSPENDED"],
              },
              targetId: roasterId,
              targetType: "ROASTER",
            },
          }),
          database.adminActionLog.findFirst({
            orderBy: { createdAt: "desc" },
            where: {
              actionType: "ROASTER_REACTIVATION_REQUESTED",
              targetId: roasterId,
              targetType: "ROASTER",
            },
          }),
        ])
      : [null, null];

  return {
    account: {
      businessName:
        roaster.application?.businessName?.trim() || roaster.email,
      chargesEnabled: roaster.chargesEnabled,
      latestRequestAt: latestRequest?.createdAt ?? null,
      payoutsEnabled: roaster.payoutsEnabled,
      status: roaster.status,
      stripeOnboarding: roaster.stripeOnboarding,
      suspensionReason: latestSuspension
        ? getSuspensionReasonLabel(
            getSuspensionReasonCategoryFromAction(latestSuspension)
          )
        : null,
    },
    counts,
    orders,
  };
}

async function getDashboardCounts(roasterId: string): Promise<DashboardCounts> {
  const baseWhere = { roasterId };

  const [toShip, shipped, delivered, all, flagged] = await Promise.all([
    database.order.count({
      where: { ...baseWhere, status: "CONFIRMED" },
    }),
    database.order.count({
      where: { ...baseWhere, status: "SHIPPED" },
    }),
    database.order.count({
      where: { ...baseWhere, status: "DELIVERED" },
    }),
    database.order.count({
      where: baseWhere,
    }),
    database.order.count({
      where: {
        ...baseWhere,
        flaggedAt: { not: null },
        flagResolvedAt: null,
      },
    }),
  ]);

  return {
    all,
    delivered,
    flagged,
    shipped,
    toShip,
  };
}

function getDashboardOrders(
  roasterId: string,
  view: OrderQueueView
): Promise<DashboardOrderRow[]> {
  if (view === "to-ship") {
    return database.order.findMany({
      orderBy: [{ fulfillBy: "asc" }, { createdAt: "asc" }],
      select: orderSelect,
      where: { roasterId, status: "CONFIRMED" },
    });
  }

  if (view === "shipped") {
    return database.order.findMany({
      orderBy: [{ shippedAt: "desc" }, { createdAt: "desc" }],
      select: orderSelect,
      where: { roasterId, status: "SHIPPED" },
    });
  }

  if (view === "delivered") {
    return database.order.findMany({
      orderBy: [{ deliveredAt: "desc" }, { createdAt: "desc" }],
      select: orderSelect,
      where: { roasterId, status: "DELIVERED" },
    });
  }

  return database.order.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: orderSelect,
    where: { roasterId },
  });
}
