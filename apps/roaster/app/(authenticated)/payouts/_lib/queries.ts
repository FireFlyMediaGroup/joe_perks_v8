import "server-only";

import { database } from "@joe-perks/db";
import type {
  DebtReason,
  DisputeOutcome,
  FaultType,
  OrderStatus,
  OrderEventType,
  PayoutStatus,
  Prisma,
  RoasterStatus,
  StripeOnboardingStatus,
} from "@joe-perks/db";

export interface PayoutAccountSnapshot {
  readonly businessName: string;
  readonly chargesEnabled: boolean;
  readonly payoutsEnabled: boolean;
  readonly status: RoasterStatus;
  readonly stripeOnboarding: StripeOnboardingStatus;
}

export interface PayoutHistoryRow {
  readonly campaign: {
    readonly name: string;
    readonly org: {
      readonly application: {
        readonly orgName: string | null;
      };
      readonly slug: string;
    };
  };
  readonly createdAt: Date;
  readonly deliveredAt: Date | null;
  readonly id: string;
  readonly latestPayoutEvent: {
    readonly createdAt: Date;
    readonly eventType: "PAYOUT_FAILED" | "PAYOUT_TRANSFERRED";
    readonly payload: unknown;
  } | null;
  readonly orderNumber: string;
  readonly payoutEligibleAt: Date | null;
  readonly payoutStatus: PayoutStatus;
  readonly roasterAmount: number;
  readonly roasterTotal: number;
  readonly shippingAmount: number;
  readonly status: OrderStatus;
  readonly stripeTransferId: string | null;
}

export interface DebtRow {
  readonly amount: number;
  readonly createdAt: Date;
  readonly id: string;
  readonly order: {
    readonly id: string;
    readonly orderNumber: string;
  } | null;
  readonly reason: DebtReason;
}

export interface DisputeRow {
  readonly createdAt: Date;
  readonly faultAttribution: FaultType | null;
  readonly id: string;
  readonly order: {
    readonly id: string;
    readonly orderNumber: string;
    readonly payoutEligibleAt: Date | null;
    readonly payoutStatus: PayoutStatus;
    readonly roasterTotal: number;
  };
  readonly outcome: DisputeOutcome | null;
  readonly respondBy: Date | null;
  readonly stripeDisputeId: string;
}

export interface RoasterPayoutsPageData {
  readonly account: PayoutAccountSnapshot;
  readonly debts: DebtRow[];
  readonly disputes: DisputeRow[];
  readonly payouts: PayoutHistoryRow[];
}

const payoutEventTypes: OrderEventType[] = [
  "PAYOUT_FAILED",
  "PAYOUT_TRANSFERRED",
];

const payoutHistorySelect = {
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
  createdAt: true,
  deliveredAt: true,
  events: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      createdAt: true,
      eventType: true,
      payload: true,
    },
    take: 1,
    where: {
      eventType: {
        in: payoutEventTypes,
      },
    },
  },
  id: true,
  orderNumber: true,
  payoutEligibleAt: true,
  payoutStatus: true,
  roasterAmount: true,
  roasterTotal: true,
  shippingAmount: true,
  status: true,
  stripeTransferId: true,
} satisfies Prisma.OrderSelect;

export async function getRoasterPayoutsPageData(
  roasterId: string
): Promise<RoasterPayoutsPageData> {
  const [roaster, payouts, debts, disputes] = await Promise.all([
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
    database.order.findMany({
      orderBy: [{ deliveredAt: "desc" }, { payoutEligibleAt: "desc" }, { createdAt: "desc" }],
      select: payoutHistorySelect,
      where: {
        payoutStatus: {
          not: "PENDING",
        },
        roasterId,
      },
    }),
    database.roasterDebt.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        amount: true,
        createdAt: true,
        id: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        reason: true,
      },
      where: {
        roasterId,
        settled: false,
      },
    }),
    database.disputeRecord.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        createdAt: true,
        faultAttribution: true,
        id: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            payoutEligibleAt: true,
            payoutStatus: true,
            roasterTotal: true,
          },
        },
        outcome: true,
        respondBy: true,
        stripeDisputeId: true,
      },
      where: {
        order: {
          roasterId,
        },
      },
    }),
  ]);

  if (!roaster) {
    throw new Error(`Roaster ${roasterId} not found`);
  }

  return {
    account: {
      businessName:
        roaster.application?.businessName?.trim() || roaster.email,
      chargesEnabled: roaster.chargesEnabled,
      payoutsEnabled: roaster.payoutsEnabled,
      status: roaster.status,
      stripeOnboarding: roaster.stripeOnboarding,
    },
    debts,
    disputes,
    payouts: payouts.map((payout) => ({
      campaign: payout.campaign,
      createdAt: payout.createdAt,
      deliveredAt: payout.deliveredAt,
      id: payout.id,
      latestPayoutEvent: payout.events[0]
        ? {
            createdAt: payout.events[0].createdAt,
            eventType: payout.events[0].eventType as
              | "PAYOUT_FAILED"
              | "PAYOUT_TRANSFERRED",
            payload: payout.events[0].payload,
          }
        : null,
      orderNumber: payout.orderNumber,
      payoutEligibleAt: payout.payoutEligibleAt,
      payoutStatus: payout.payoutStatus,
      roasterAmount: payout.roasterAmount,
      roasterTotal: payout.roasterTotal,
      shippingAmount: payout.shippingAmount,
      status: payout.status,
      stripeTransferId: payout.stripeTransferId,
    })),
  };
}
