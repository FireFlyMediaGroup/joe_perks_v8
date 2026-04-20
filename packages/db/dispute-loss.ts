import "server-only";

import { database } from "./database";

const TRAILING_DISPUTE_WINDOW_DAYS = 90;

export interface ProcessLostRoasterFaultDisputeInput {
  actorLabel: string;
  orderId: string;
  recoveredRoasterTransferCents: number;
  reversalAttempted: boolean;
  reversalError?: string | null;
  reversalId?: string | null;
  stripeDisputeId: string;
  trigger: "admin" | "webhook";
}

export interface ProcessLostRoasterFaultDisputeResult {
  autoSuspended: boolean;
  chargebackDebtCents: number;
  createdChargebackDebt: boolean;
  createdDisputeLossDebt: boolean;
  disputeCount90d: number;
  disputeLossDebtCents: number;
  orderNumber: string;
  roasterId: string;
}

export async function processLostRoasterFaultDispute({
  actorLabel,
  orderId,
  recoveredRoasterTransferCents,
  reversalAttempted,
  reversalError,
  reversalId,
  stripeDisputeId,
  trigger,
}: ProcessLostRoasterFaultDisputeInput): Promise<ProcessLostRoasterFaultDisputeResult> {
  const order = await database.order.findUniqueOrThrow({
    include: {
      roaster: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    where: { id: orderId },
  });
  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  const disputeLossDebtCents = settings.disputeFeeCents + order.stripeFee;
  const chargebackDebtCents = order.stripeTransferId
    ? Math.max(0, order.roasterTotal - recoveredRoasterTransferCents)
    : 0;
  const windowStart = new Date(
    Date.now() - TRAILING_DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  return database.$transaction(async (tx) => {
    const existingDebts = await tx.roasterDebt.findMany({
      select: { reason: true },
      where: {
        orderId,
        reason: { in: ["CHARGEBACK", "DISPUTE_LOSS"] },
      },
    });

    const hasChargebackDebt = existingDebts.some(
      (debt) => debt.reason === "CHARGEBACK"
    );
    const hasDisputeLossDebt = existingDebts.some(
      (debt) => debt.reason === "DISPUTE_LOSS"
    );

    if (!hasDisputeLossDebt && disputeLossDebtCents > 0) {
      await tx.roasterDebt.create({
        data: {
          amount: disputeLossDebtCents,
          orderId,
          reason: "DISPUTE_LOSS",
          roasterId: order.roasterId,
        },
      });
    }

    if (!hasChargebackDebt && chargebackDebtCents > 0) {
      await tx.roasterDebt.create({
        data: {
          amount: chargebackDebtCents,
          orderId,
          reason: "CHARGEBACK",
          roasterId: order.roasterId,
        },
      });
    }

    const disputeCount90d = await tx.disputeRecord.count({
      where: {
        createdAt: { gte: windowStart },
        faultAttribution: "ROASTER",
        order: { roasterId: order.roasterId },
        outcome: "LOST",
      },
    });

    const shouldAutoSuspend =
      disputeCount90d >= 3 && order.roaster.status !== "SUSPENDED";

    await tx.roaster.update({
      data: {
        disputeCount90d,
        ...(shouldAutoSuspend ? { status: "SUSPENDED" } : {}),
      },
      where: { id: order.roasterId },
    });

    if (shouldAutoSuspend) {
      await tx.adminActionLog.create({
        data: {
          actionType: "ROASTER_AUTO_SUSPENDED",
          actorLabel,
          payload: {
            chargebackDebtCents,
            disputeCount90d,
            disputeLossDebtCents,
            orderId,
            recoveredRoasterTransferCents,
            reversalAttempted,
            reversalError: reversalError ?? null,
            reversalId: reversalId ?? null,
            stripeDisputeId,
            trigger,
          },
          targetId: order.roasterId,
          targetType: "ROASTER",
        },
      });
    }

    return {
      autoSuspended: shouldAutoSuspend,
      chargebackDebtCents,
      createdChargebackDebt: !hasChargebackDebt && chargebackDebtCents > 0,
      createdDisputeLossDebt: !hasDisputeLossDebt && disputeLossDebtCents > 0,
      disputeCount90d,
      disputeLossDebtCents,
      orderNumber: order.orderNumber,
      roasterId: order.roasterId,
    };
  });
}
