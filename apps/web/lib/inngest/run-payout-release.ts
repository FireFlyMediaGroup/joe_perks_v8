import { database, logOrderEvent } from "@joe-perks/db";
import {
  isStripeConfigured,
  transferToConnectedAccount,
} from "@joe-perks/stripe";

/**
 * Payout job: `Campaign.totalRaised` is incremented when the order is paid (webhook);
 * that reflects pledged fundraiser totals at checkout — see US-06-01 handoff notes.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: explicit payout + debt branches per US-06-01
async function payoutSingleOrder(orderId: string): Promise<void> {
  const order = await database.order.findUniqueOrThrow({
    include: {
      campaign: { include: { org: true } },
      roaster: true,
    },
    where: { id: orderId },
  });

  const roaster = order.roaster;
  if (!(roaster.stripeAccountId && roaster.payoutsEnabled)) {
    console.error("payout-release: roaster Connect not ready", {
      order_id: order.id,
      roaster_id: roaster.id,
    });
    await database.order.update({
      where: { id: order.id },
      data: { payoutStatus: "FAILED" },
    });
    await logOrderEvent(order.id, "PAYOUT_FAILED", "SYSTEM", null, {
      reason: "roaster_connect_not_ready",
    });
    return;
  }

  const chargeId = order.stripeChargeId;
  if (!chargeId) {
    console.error("payout-release: missing charge", { order_id: order.id });
    return;
  }

  const unsettledDebts = await database.roasterDebt.findMany({
    where: { roasterId: roaster.id, settled: false },
  });
  const totalDebt = unsettledDebts.reduce((sum, d) => sum + d.amount, 0);
  const netRoasterAmount = Math.max(0, order.roasterTotal - totalDebt);

  if (totalDebt > 0 && netRoasterAmount <= 0) {
    console.error("payout-release: manual debt resolution required", {
      order_id: order.id,
      roaster_total: order.roasterTotal,
      total_debt: totalDebt,
    });
    await database.order.update({
      where: { id: order.id },
      data: { payoutStatus: "FAILED" },
    });
    await logOrderEvent(order.id, "PAYOUT_FAILED", "SYSTEM", null, {
      reason: "roaster_debt_exceeds_payout",
      roaster_total: order.roasterTotal,
      total_debt: totalDebt,
      unsettled_debt_ids: unsettledDebts.map((debt) => debt.id),
    });
    return;
  }

  try {
    let roasterTransferId: string | null = null;

    if (netRoasterAmount > 0) {
      const roasterTransfer = await transferToConnectedAccount({
        amountCents: netRoasterAmount,
        destinationStripeAccountId: roaster.stripeAccountId,
        metadata: { order_id: order.id, type: "roaster_payout" },
        sourceChargeId: chargeId,
        transferGroup: order.id,
      });
      roasterTransferId = roasterTransfer.id;

      if (unsettledDebts.length > 0) {
        await database.roasterDebt.updateMany({
          data: { settled: true, settledAt: new Date() },
          where: { id: { in: unsettledDebts.map((d) => d.id) } },
        });
      }
    } else {
      console.log("payout-release: roaster transfer skipped (net <= 0)", {
        order_id: order.id,
        roaster_total: order.roasterTotal,
        total_debt: totalDebt,
      });
    }

    const org = order.campaign.org;
    let orgTransferId: string | null = null;

    if (order.orgAmount > 0 && org.stripeAccountId) {
      try {
        const orgTransfer = await transferToConnectedAccount({
          amountCents: order.orgAmount,
          destinationStripeAccountId: org.stripeAccountId,
          metadata: { order_id: order.id, type: "org_payout" },
          sourceChargeId: chargeId,
          transferGroup: order.id,
        });
        orgTransferId = orgTransfer.id;
      } catch (e) {
        console.error("payout-release: org transfer failed after roaster", {
          error: e instanceof Error ? e.message : "unknown",
          order_id: order.id,
          roaster_transfer_id: roasterTransferId,
        });
        await database.order.update({
          data: {
            payoutStatus: "FAILED",
            stripeTransferId: roasterTransferId,
          },
          where: { id: order.id },
        });
        await logOrderEvent(order.id, "PAYOUT_FAILED", "SYSTEM", null, {
          error: e instanceof Error ? e.message : "unknown",
          roaster_transfer_id: roasterTransferId,
          stage: "org_transfer",
        });
        return;
      }
    } else if (order.orgAmount > 0 && !org.stripeAccountId) {
      console.error(
        "payout-release: org share unpaid — missing Stripe account",
        {
          order_id: order.id,
          org_id: org.id,
        }
      );
    }

    await database.order.update({
      data: {
        payoutStatus: "TRANSFERRED",
        stripeOrgTransfer: orgTransferId,
        stripeTransferId: roasterTransferId,
      },
      where: { id: order.id },
    });

    await logOrderEvent(order.id, "PAYOUT_TRANSFERRED", "SYSTEM", null, {
      net_roaster_amount: netRoasterAmount,
      org_transfer_id: orgTransferId,
      roaster_transfer_id: roasterTransferId,
      total_debt: totalDebt,
    });

    console.log("payout-release: transfers recorded", {
      order_id: order.id,
      org_transfer_id: orgTransferId,
      roaster_transfer_id: roasterTransferId,
    });
  } catch (e) {
    console.error("payout-release: roaster transfer failed", {
      error: e instanceof Error ? e.message : "unknown",
      order_id: order.id,
    });
    await database.order.update({
      data: { payoutStatus: "FAILED" },
      where: { id: order.id },
    });
    await logOrderEvent(order.id, "PAYOUT_FAILED", "SYSTEM", null, {
      error: e instanceof Error ? e.message : "unknown",
      stage: "roaster_transfer",
    });
  }
}

/**
 * Daily job: transfer roaster + org shares for delivered orders past hold.
 * Requires `DELIVERED`, `HELD`, `payoutEligibleAt <= now`, and no prior roaster transfer row.
 */
export async function runPayoutRelease(): Promise<void> {
  if (!isStripeConfigured()) {
    console.error("payout-release: skipped — Stripe not configured");
    return;
  }

  const now = new Date();

  const orders = await database.order.findMany({
    select: { id: true },
    where: {
      payoutEligibleAt: { lte: now },
      payoutStatus: "HELD",
      status: "DELIVERED",
      stripeChargeId: { not: null },
      stripeTransferId: null,
    },
  });

  for (const row of orders) {
    await payoutSingleOrder(row.id);
  }
}
