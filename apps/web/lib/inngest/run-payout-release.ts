import { database } from "@joe-perks/db";
import {
  isStripeConfigured,
  transferToConnectedAccount,
} from "@joe-perks/stripe";

async function payoutSingleOrder(orderId: string): Promise<void> {
  const order = await database.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      roaster: true,
      campaign: { include: { org: true } },
    },
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
    return;
  }

  const chargeId = order.stripeChargeId;
  if (!chargeId) {
    console.error("payout-release: missing charge", { order_id: order.id });
    return;
  }

  try {
    const roasterTransfer = await transferToConnectedAccount({
      amountCents: order.roasterTotal,
      destinationStripeAccountId: roaster.stripeAccountId,
      sourceChargeId: chargeId,
      transferGroup: order.id,
      metadata: { order_id: order.id, type: "roaster_payout" },
    });

    const org = order.campaign.org;
    let orgTransferId: string | null = null;

    if (order.orgAmount > 0 && org.stripeAccountId) {
      try {
        const orgTransfer = await transferToConnectedAccount({
          amountCents: order.orgAmount,
          destinationStripeAccountId: org.stripeAccountId,
          sourceChargeId: chargeId,
          transferGroup: order.id,
          metadata: { order_id: order.id, type: "org_payout" },
        });
        orgTransferId = orgTransfer.id;
      } catch (e) {
        console.error("payout-release: org transfer failed after roaster", {
          order_id: order.id,
          roaster_transfer_id: roasterTransfer.id,
          error: e instanceof Error ? e.message : "unknown",
        });
        await database.order.update({
          where: { id: order.id },
          data: {
            stripeTransferId: roasterTransfer.id,
            payoutStatus: "FAILED",
          },
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
      where: { id: order.id },
      data: {
        stripeTransferId: roasterTransfer.id,
        stripeOrgTransfer: orgTransferId,
        payoutStatus: "TRANSFERRED",
      },
    });

    console.log("payout-release: transfers recorded", {
      order_id: order.id,
      roaster_transfer_id: roasterTransfer.id,
      org_transfer_id: orgTransferId,
    });
  } catch (e) {
    console.error("payout-release: roaster transfer failed", {
      order_id: order.id,
      error: e instanceof Error ? e.message : "unknown",
    });
    await database.order.update({
      where: { id: order.id },
      data: { payoutStatus: "FAILED" },
    });
  }
}

/**
 * Daily job: transfer roaster + org shares for delivered orders past hold.
 * Requires `DELIVERED`, `HELD`, `payoutEligibleAt <= now`, and no prior roaster transfer.
 */
export async function runPayoutRelease(): Promise<void> {
  if (!isStripeConfigured()) {
    console.error("payout-release: skipped — Stripe not configured");
    return;
  }

  const now = new Date();

  const orders = await database.order.findMany({
    where: {
      status: "DELIVERED",
      payoutStatus: "HELD",
      payoutEligibleAt: { lte: now },
      stripeChargeId: { not: null },
      stripeTransferId: null,
    },
    select: { id: true },
  });

  for (const row of orders) {
    await payoutSingleOrder(row.id);
  }
}
