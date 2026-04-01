import crypto from "node:crypto";

import {
  database,
  logOrderEvent,
  Prisma,
  processLostRoasterFaultDispute,
} from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import {
  AccountSuspendedEmail,
  ACCOUNT_SUSPENDED_SUBJECT,
} from "@joe-perks/email/templates/account-suspended";
import DisputeAdminAlertEmail from "@joe-perks/email/templates/dispute-admin-alert";
import MagicLinkFulfillmentEmail from "@joe-perks/email/templates/magic-link-fulfillment";
import OrderConfirmationEmail from "@joe-perks/email/templates/order-confirmation";
import {
  getStripe,
  mapStripeAccountToOnboardingStatus,
  reverseTransferIfPossible,
} from "@joe-perks/stripe";
import { NextResponse } from "next/server";
import { createElement } from "react";
import type Stripe from "stripe";

export const runtime = "nodejs";

const ROASTER_APP_ORIGIN_DEFAULT = "http://localhost:3001";
const TRAILING_SLASH = /\/$/;

function getDisputeChargeId(dispute: Stripe.Dispute): string | null {
  if (typeof dispute.charge === "string") {
    return dispute.charge;
  }

  return dispute.charge && "id" in dispute.charge ? dispute.charge.id : null;
}

function getDisputeRespondBy(dispute: Stripe.Dispute): Date | null {
  const dueBy = dispute.evidence_details?.due_by;
  return typeof dueBy === "number" ? new Date(dueBy * 1000) : null;
}

function getDisputeOutcome(
  dispute: Stripe.Dispute
): "LOST" | "WITHDRAWN" | "WON" {
  if (dispute.status === "won") {
    return "WON";
  }

  if (dispute.status === "lost") {
    return "LOST";
  }

  return "WITHDRAWN";
}

async function sendDisputeAutoSuspensionAlert(input: {
  disputeCount90d: number;
  orderNumber: string;
  roasterId: string;
  stripeDisputeId: string;
}): Promise<void> {
  const adminEmail = process.env.PLATFORM_ALERT_EMAIL?.trim();
  if (!adminEmail) {
    return;
  }

  try {
    await sendEmail({
      entityId: input.roasterId,
      entityType: "roaster",
      react: createElement(DisputeAdminAlertEmail, input),
      subject: "[Joe Perks] Roaster auto-suspended after dispute loss",
      template: "dispute_admin_roaster_auto_suspended",
      to: adminEmail,
    });
  } catch {
    console.error("dispute auto-suspension email failed", {
      roaster_id: input.roasterId,
      stripe_dispute_id: input.stripeDisputeId,
    });
  }
}

async function sendRoasterAutoSuspensionEmail(input: {
  roasterId: string;
  stripeDisputeId: string;
}): Promise<void> {
  const roaster = await database.roaster.findUnique({
    include: {
      application: { select: { businessName: true } },
    },
    where: { id: input.roasterId },
  });

  if (!roaster) {
    return;
  }

  try {
    const loginOrigin =
      process.env.ROASTER_APP_ORIGIN?.trim() || ROASTER_APP_ORIGIN_DEFAULT;
    await sendEmail({
      entityId: `${input.roasterId}:${input.stripeDisputeId}`,
      entityType: "roaster_lifecycle",
      react: createElement(AccountSuspendedEmail, {
        accountName: roaster.application.businessName || roaster.email,
        accountTypeLabel: "roaster",
        loginUrl: `${loginOrigin.replace(TRAILING_SLASH, "")}/dashboard`,
        reasonLabel: "Dispute risk review",
      }),
      subject: ACCOUNT_SUSPENDED_SUBJECT,
      template: "account_suspended",
      to: roaster.email,
    });
  } catch {
    console.error("roaster auto-suspension email failed", {
      roaster_id: input.roasterId,
      stripe_dispute_id: input.stripeDisputeId,
    });
  }
}

async function createFulfillmentMagicLink(
  orderId: string,
  roasterId: string
): Promise<{ id: string; token: string }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const dedupeKey = `order_fulfillment:${orderId}`;

  const created = await database.magicLink.upsert({
    where: { dedupeKey },
    update: {},
    create: {
      dedupeKey,
      token,
      purpose: "ORDER_FULFILLMENT",
      actorId: roasterId,
      actorType: "ROASTER",
      payload: { order_id: orderId },
      expiresAt,
    },
  });

  console.log("fulfillment magic link created", {
    order_id: orderId,
    magic_link_id: created.id,
  });

  return { id: created.id, token: created.token };
}

async function sendRoasterFulfillmentEmail(
  orderId: string,
  magicLinkToken: string
): Promise<void> {
  const origin =
    process.env.ROASTER_APP_ORIGIN?.trim() || ROASTER_APP_ORIGIN_DEFAULT;
  const fulfillUrl = `${origin.replace(TRAILING_SLASH, "")}/fulfill/${magicLinkToken}`;

  const order = await database.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      roaster: { select: { email: true } },
    },
  });
  if (!order || order.status !== "CONFIRMED") {
    return;
  }

  try {
    await sendEmail({
      entityId: order.id,
      entityType: "order",
      react: createElement(MagicLinkFulfillmentEmail, {
        fulfillUrl,
        items: order.items.map((i) => ({
          name: i.productName,
          priceInCents: i.unitPrice,
          quantity: i.quantity,
        })),
        orderNumber: order.orderNumber,
        shippingInCents: order.shippingAmount,
        totalInCents: order.grossAmount,
      }),
      subject: `New order ${order.orderNumber} — fulfill on Joe Perks`,
      template: "magic_link_fulfillment",
      to: order.roaster.email,
    });
  } catch {
    console.error("roaster fulfillment email failed", { order_id: orderId });
  }
}

async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  const id = account.id;
  const onboarding = mapStripeAccountToOnboardingStatus(account);

  const roaster = await database.roaster.findFirst({
    where: { stripeAccountId: id },
  });
  if (roaster) {
    const charges = account.charges_enabled ?? false;
    const payouts = account.payouts_enabled ?? false;
    const fullyOnboarded = onboarding === "COMPLETE" && charges && payouts;

    // Promote ONBOARDING → ACTIVE per RA8 in 05-approval-chain.mermaid.
    // Never override SUSPENDED — that's an admin action.
    const promoteToActive = fullyOnboarded && roaster.status === "ONBOARDING";

    await database.roaster.update({
      where: { id: roaster.id },
      data: {
        chargesEnabled: charges,
        payoutsEnabled: payouts,
        stripeOnboarding: onboarding,
        ...(promoteToActive && { status: "ACTIVE" }),
      },
    });
    return;
  }

  const org = await database.org.findFirst({
    where: { stripeAccountId: id },
  });
  if (org) {
    const charges = account.charges_enabled ?? false;
    const payouts = account.payouts_enabled ?? false;
    const fullyOnboarded = onboarding === "COMPLETE" && charges && payouts;

    // Promote ONBOARDING → ACTIVE per OA11–OA13 in 05-approval-chain.mermaid.
    const promoteToActive = fullyOnboarded && org.status === "ONBOARDING";

    await database.org.update({
      where: { id: org.id },
      data: {
        chargesEnabled: charges,
        payoutsEnabled: payouts,
        stripeOnboarding: onboarding,
        ...(promoteToActive && { status: "ACTIVE" }),
      },
    });
  }
}

async function sendBuyerOrderConfirmationEmail(orderId: string): Promise<void> {
  const order = await database.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      campaign: {
        include: {
          org: {
            include: {
              application: { select: { orgName: true } },
            },
          },
        },
      },
      items: true,
    },
  });
  if (!order || order.status !== "CONFIRMED" || !order.buyer) {
    return;
  }

  const orgName =
    order.campaign.org.application.orgName ?? order.campaign.org.slug;

  try {
    await sendEmail({
      entityId: order.id,
      entityType: "order",
      react: createElement(OrderConfirmationEmail, {
        buyerName: order.buyer.name ?? "Customer",
        items: order.items.map((i) => ({
          name: i.productName,
          priceInCents: i.unitPrice,
          quantity: i.quantity,
        })),
        orderNumber: order.orderNumber,
        orgName,
        shippingInCents: order.shippingAmount,
        totalInCents: order.grossAmount,
      }),
      subject: `Order ${order.orderNumber} confirmed`,
      template: "order_confirmation",
      to: order.buyer.email,
    });
  } catch {
    console.error("order confirmation email failed", { order_id: orderId });
  }
}

async function handlePaymentIntentSucceeded(
  pi: Stripe.PaymentIntent
): Promise<void> {
  const orderId = pi.metadata.order_id;
  if (!orderId) {
    return;
  }

  const order = await database.order.findUnique({
    where: { id: orderId },
    select: {
      campaignId: true,
      orgAmount: true,
      roasterId: true,
    },
  });
  if (!order) {
    return;
  }

  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  const chargeId =
    typeof pi.latest_charge === "string" ? pi.latest_charge : null;

  const confirmedOrder = await database.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: {
        status: "CONFIRMED",
        stripeChargeId: chargeId,
        payoutStatus: "HELD",
        // Initial hold-until date; US-05-03 overwrites at delivery confirmation.
        payoutEligibleAt: new Date(
          Date.now() + settings.payoutHoldDays * 24 * 60 * 60 * 1000
        ),
        fulfillBy: new Date(
          Date.now() + settings.slaBreachHours * 60 * 60 * 1000
        ),
      },
    });
    if (updated.count === 0) {
      return false;
    }

    // OrderEvent must stay in this transaction with the order confirmation (atomicity).
    await tx.orderEvent.create({
      data: {
        orderId,
        eventType: "PAYMENT_SUCCEEDED",
        actorType: "SYSTEM",
        payload: { stripe_pi_id: pi.id },
      },
    });

    // Campaign.totalRaised: fundraiser pledge recorded at payment (see US-06-01; diagram also mentions payout-time — MVP uses confirmation).
    await tx.campaign.update({
      where: { id: order.campaignId },
      data: { totalRaised: { increment: order.orgAmount } },
    });

    return true;
  });
  if (!confirmedOrder) {
    return;
  }

  await sendBuyerOrderConfirmationEmail(orderId);

  try {
    const link = await createFulfillmentMagicLink(orderId, order.roasterId);
    await sendRoasterFulfillmentEmail(orderId, link.token);
  } catch (e) {
    console.error("fulfillment magic link / email failed", {
      order_id: orderId,
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}

async function handlePaymentIntentFailed(
  pi: Stripe.PaymentIntent
): Promise<void> {
  const orderId = pi.metadata.order_id;
  if (!orderId) {
    return;
  }

  await logOrderEvent(
    orderId,
    "PAYMENT_FAILED",
    "SYSTEM",
    null,
    {
      stripe_pi_id: pi.id,
      failure_code: pi.last_payment_error?.code ?? null,
    },
    null
  );
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const chargeId = getDisputeChargeId(dispute);
  if (!chargeId) {
    return;
  }

  const order = await database.order.findFirst({
    select: { id: true },
    where: { stripeChargeId: chargeId },
  });
  if (!order) {
    console.error("dispute webhook: order not found", {
      stripe_charge_id: chargeId,
      stripe_dispute_id: dispute.id,
    });
    return;
  }

  const respondBy = getDisputeRespondBy(dispute);
  const payload = {
    amount_cents: dispute.amount,
    currency: dispute.currency,
    reason: dispute.reason,
    respond_by: respondBy?.toISOString() ?? null,
    stripe_dispute_id: dispute.id,
    stripe_status: dispute.status,
  };

  await database.$transaction(async (tx) => {
    const existing = await tx.disputeRecord.findUnique({
      where: { orderId: order.id },
    });

    await tx.disputeRecord.upsert({
      create: {
        orderId: order.id,
        respondBy,
        stripeDisputeId: dispute.id,
      },
      update: {
        outcome: null,
        respondBy,
        stripeDisputeId: dispute.id,
      },
      where: { orderId: order.id },
    });

    const shouldLogEvent =
      !existing ||
      existing.outcome !== null ||
      existing.stripeDisputeId !== dispute.id;

    if (shouldLogEvent) {
      await tx.orderEvent.create({
        data: {
          actorType: "SYSTEM",
          eventType: "DISPUTE_OPENED",
          orderId: order.id,
          payload,
        },
      });
    }
  });
}

async function handleChargeDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
  const chargeId = getDisputeChargeId(dispute);
  if (!chargeId) {
    return;
  }

  const order = await database.order.findFirst({
    select: {
      id: true,
      orderNumber: true,
      roasterId: true,
      roasterTotal: true,
      stripeTransferId: true,
    },
    where: { stripeChargeId: chargeId },
  });
  if (!order) {
    console.error("dispute webhook: order not found", {
      stripe_charge_id: chargeId,
      stripe_dispute_id: dispute.id,
    });
    return;
  }

  const outcome = getDisputeOutcome(dispute);
  const respondBy = getDisputeRespondBy(dispute);
  const disputeRecord = await database.$transaction(async (tx) => {
    const existing = await tx.disputeRecord.findUnique({
      where: { orderId: order.id },
    });

    const updated = await tx.disputeRecord.upsert({
      create: {
        orderId: order.id,
        outcome,
        respondBy,
        stripeDisputeId: dispute.id,
      },
      update: {
        outcome,
        respondBy,
        stripeDisputeId: dispute.id,
      },
      where: { orderId: order.id },
    });

    if (existing?.outcome !== outcome) {
      await tx.orderEvent.create({
        data: {
          actorType: "SYSTEM",
          eventType: "DISPUTE_CLOSED",
          orderId: order.id,
          payload: {
            amount_cents: dispute.amount,
            currency: dispute.currency,
            fault_attribution: updated.faultAttribution,
            outcome,
            reason: dispute.reason,
            stripe_dispute_id: dispute.id,
            stripe_status: dispute.status,
          },
        },
      });
    }

    return {
      faultAttribution: updated.faultAttribution,
      shouldApplyRoasterRecovery:
        existing?.outcome !== "LOST" &&
        outcome === "LOST" &&
        updated.faultAttribution === "ROASTER",
    };
  });

  if (!disputeRecord.shouldApplyRoasterRecovery) {
    return;
  }

  const reversal = await reverseTransferIfPossible({
    amountCents: order.roasterTotal,
    metadata: {
      order_id: order.id,
      stripe_dispute_id: dispute.id,
      type: "roaster_dispute_reversal",
    },
    transferId: order.stripeTransferId,
  });

  const recovery = await processLostRoasterFaultDispute({
    actorLabel: "stripe-webhook",
    orderId: order.id,
    recoveredRoasterTransferCents: reversal.recoveredCents,
    reversalAttempted: reversal.attempted,
    reversalError: reversal.error,
    reversalId: reversal.reversalId,
    stripeDisputeId: dispute.id,
    trigger: "webhook",
  });

  if (recovery.autoSuspended) {
    await Promise.all([
      sendDisputeAutoSuspensionAlert({
        disputeCount90d: recovery.disputeCount90d,
        orderNumber: recovery.orderNumber,
        roasterId: recovery.roasterId,
        stripeDisputeId: dispute.id,
      }),
      sendRoasterAutoSuspensionEmail({
        roasterId: recovery.roasterId,
        stripeDisputeId: dispute.id,
      }),
    ]);
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature" },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const existing = await database.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "charge.dispute.closed":
        await handleChargeDisputeClosed(event.data.object as Stripe.Dispute);
        break;
      case "charge.dispute.created":
        await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("stripe webhook processing failed", {
      stripe_event_id: event.id,
      event_type: event.type,
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  try {
    await database.stripeEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
  }

  return NextResponse.json({ received: true });
}
