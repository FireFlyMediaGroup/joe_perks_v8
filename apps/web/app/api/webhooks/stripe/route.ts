import crypto from "node:crypto";

import {
  database,
  logOrderEvent,
  Prisma,
  processLostRoasterFaultDispute,
} from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import {
  ACCOUNT_SUSPENDED_SUBJECT,
  AccountSuspendedEmail,
} from "@joe-perks/email/templates/account-suspended";
import DisputeAdminAlertEmail from "@joe-perks/email/templates/dispute-admin-alert";
import MagicLinkFulfillmentEmail from "@joe-perks/email/templates/magic-link-fulfillment";
import OrderConfirmationEmail from "@joe-perks/email/templates/order-confirmation";
import {
  getStripe,
  mapRecipientAccountStatusToOnboardingStatus,
  mapStripeAccountToOnboardingStatus,
  retrieveRecipientAccountStatus,
  reverseTransferIfPossible,
  type Stripe,
} from "@joe-perks/stripe";
import { createPaymentLog } from "@repo/observability/payment-log";
import { NextResponse } from "next/server";
import { createElement } from "react";

export const runtime = "nodejs";

type StripeClient = ReturnType<typeof getStripe>;
type StripeV2Event = Awaited<
  ReturnType<StripeClient["v2"]["core"]["events"]["retrieve"]>
>;

const ROASTER_APP_ORIGIN_DEFAULT = "http://localhost:3001";
const TRAILING_SLASH = /\/$/;
const V2_CONNECT_ACCOUNT_EVENT_TYPES = new Set([
  "v2.core.account[requirements].updated",
  "v2.core.account[configuration.recipient].capability_status_updated",
]);

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
    createPaymentLog({ roasterId: input.roasterId }).error(
      "dispute auto-suspension email failed",
      { stripe_dispute_id: input.stripeDisputeId }
    );
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
    createPaymentLog({ roasterId: input.roasterId }).error(
      "roaster auto-suspension email failed",
      { stripe_dispute_id: input.stripeDisputeId }
    );
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

  createPaymentLog({ orderId, roasterId }).info(
    "fulfillment magic link created",
    { magic_link_id: created.id }
  );

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
    createPaymentLog({
      orderId,
      orderNumber: order.orderNumber,
      roasterId: order.roasterId,
    }).error("roaster fulfillment email failed");
  }
}

/**
 * Promote ONBOARDING → ACTIVE when fully onboarded; demote ACTIVE → ONBOARDING on
 * capability loss (Stripe disabled charges/payouts or restricted the account).
 * Returns the new status, or null to leave it unchanged (notably SUSPENDED, an
 * admin-only state).
 */
function nextConnectStatus(
  current: string,
  fullyOnboarded: boolean
): "ACTIVE" | "ONBOARDING" | null {
  if (fullyOnboarded && current === "ONBOARDING") {
    return "ACTIVE";
  }
  if (!fullyOnboarded && current === "ACTIVE") {
    return "ONBOARDING";
  }
  return null;
}

function logConnectDemotion(
  kind: "org" | "roaster",
  ctx: {
    accountId: string;
    charges: boolean;
    entityId: string;
    onboarding: string;
    payouts: boolean;
  }
): void {
  console.error(`connect: ${kind} demoted — Stripe capability lost`, {
    charges_enabled: ctx.charges,
    entity_id: ctx.entityId,
    payouts_enabled: ctx.payouts,
    stripe_account_id: ctx.accountId,
    stripe_onboarding: ctx.onboarding,
  });
}

async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  const id = account.id;
  const onboarding = mapStripeAccountToOnboardingStatus(account);
  const charges = account.charges_enabled ?? false;
  const payouts = account.payouts_enabled ?? false;
  const fullyOnboarded = onboarding === "COMPLETE" && charges && payouts;

  const roaster = await database.roaster.findFirst({
    where: { stripeAccountId: id },
  });
  if (roaster) {
    const status = nextConnectStatus(roaster.status, fullyOnboarded);
    await database.roaster.update({
      data: {
        chargesEnabled: charges,
        payoutsEnabled: payouts,
        stripeOnboarding: onboarding,
        ...(status && { status }),
      },
      where: { id: roaster.id },
    });
    if (status === "ONBOARDING") {
      logConnectDemotion("roaster", {
        accountId: id,
        charges,
        entityId: roaster.id,
        onboarding,
        payouts,
      });
    }
    return;
  }

  const org = await database.org.findFirst({
    where: { stripeAccountId: id },
  });
  if (org) {
    const status = nextConnectStatus(org.status, fullyOnboarded);
    await database.org.update({
      data: {
        chargesEnabled: charges,
        payoutsEnabled: payouts,
        stripeOnboarding: onboarding,
        ...(status && { status }),
      },
      where: { id: org.id },
    });
    if (status === "ONBOARDING") {
      logConnectDemotion("org", {
        accountId: id,
        charges,
        entityId: org.id,
        onboarding,
        payouts,
      });
    }
  }
}

async function handleRecipientAccountStatusUpdated(
  accountId: string
): Promise<void> {
  const status = await retrieveRecipientAccountStatus(accountId);
  const onboarding = mapRecipientAccountStatusToOnboardingStatus(status);
  const readyToReceivePayments = status.readyToReceivePayments;
  const fullyOnboarded = onboarding === "COMPLETE";

  const roaster = await database.roaster.findFirst({
    where: { stripeAccountId: accountId },
  });
  if (roaster) {
    const nextStatus = nextConnectStatus(roaster.status, fullyOnboarded);
    await database.roaster.update({
      data: {
        chargesEnabled: readyToReceivePayments,
        payoutsEnabled: readyToReceivePayments,
        stripeOnboarding: onboarding,
        ...(nextStatus && { status: nextStatus }),
      },
      where: { id: roaster.id },
    });
    if (nextStatus === "ONBOARDING") {
      logConnectDemotion("roaster", {
        accountId,
        charges: readyToReceivePayments,
        entityId: roaster.id,
        onboarding,
        payouts: readyToReceivePayments,
      });
    }
    return;
  }

  const org = await database.org.findFirst({
    where: { stripeAccountId: accountId },
  });
  if (org) {
    const nextStatus = nextConnectStatus(org.status, fullyOnboarded);
    await database.org.update({
      data: {
        chargesEnabled: readyToReceivePayments,
        payoutsEnabled: readyToReceivePayments,
        stripeOnboarding: onboarding,
        ...(nextStatus && { status: nextStatus }),
      },
      where: { id: org.id },
    });
    if (nextStatus === "ONBOARDING") {
      logConnectDemotion("org", {
        accountId,
        charges: readyToReceivePayments,
        entityId: org.id,
        onboarding,
        payouts: readyToReceivePayments,
      });
    }
  }
}

function getV2EventAccountId(event: StripeV2Event): string | null {
  if (
    "related_object" in event &&
    event.related_object?.type === "v2.core.account"
  ) {
    return event.related_object.id;
  }

  const data = "data" in event ? event.data : null;
  if (data && typeof data === "object" && "account_id" in data) {
    const accountId = data.account_id;
    return typeof accountId === "string" ? accountId : null;
  }

  return null;
}

async function handleV2ConnectAccountEvent(eventId: string): Promise<void> {
  const event = await getStripe().v2.core.events.retrieve(eventId);
  const accountId = getV2EventAccountId(event);
  if (!accountId) {
    createPaymentLog({}).error("stripe v2 webhook: account id not found", {
      event_type: event.type,
      stripe_event_id: event.id,
    });
    return;
  }

  await handleRecipientAccountStatusUpdated(accountId);
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
    createPaymentLog({
      orderId,
      orderNumber: order.orderNumber,
      orgId: order.campaign.orgId,
      roasterId: order.roasterId,
    }).error("order confirmation email failed");
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
      campaign: { select: { orgId: true } },
      campaignId: true,
      orderNumber: true,
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
    createPaymentLog({
      orderId,
      orderNumber: order.orderNumber,
      orgId: order.campaign.orgId,
      roasterId: order.roasterId,
    }).error("fulfillment magic link / email failed", {
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

async function handleChargeDisputeCreated(
  dispute: Stripe.Dispute
): Promise<void> {
  const chargeId = getDisputeChargeId(dispute);
  if (!chargeId) {
    return;
  }

  const order = await database.order.findFirst({
    select: { id: true },
    where: { stripeChargeId: chargeId },
  });
  if (!order) {
    createPaymentLog({}).error("dispute webhook: order not found", {
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

async function handleChargeDisputeClosed(
  dispute: Stripe.Dispute
): Promise<void> {
  const chargeId = getDisputeChargeId(dispute);
  if (!chargeId) {
    return;
  }

  const order = await database.order.findFirst({
    select: {
      campaignId: true,
      id: true,
      orderNumber: true,
      orgAmount: true,
      roasterId: true,
      roasterTotal: true,
      stripeTransferId: true,
    },
    where: { stripeChargeId: chargeId },
  });
  if (!order) {
    createPaymentLog({}).error("dispute webhook: order not found", {
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

    // A lost dispute is a chargeback — the buyer's money is gone, so cancel the
    // org's pledged share from the fundraiser total (once, on the LOST transition).
    if (existing?.outcome !== "LOST" && outcome === "LOST") {
      await tx.campaign.update({
        data: { totalRaised: { decrement: order.orgAmount } },
        where: { id: order.campaignId },
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

/**
 * Claw back a refunded order's already-transferred payouts by reversing the
 * roaster + org transfers (best-effort — funds come back only if the connected
 * account still has balance). Any shortfall is logged for manual reconciliation.
 * Runs outside the DB transaction since these are Stripe API calls.
 */
async function reverseOrderTransfers(order: {
  id: string;
  orgAmount: number;
  roasterTotal: number;
  stripeOrgTransfer: string | null;
  stripeTransferId: string | null;
}): Promise<void> {
  const roaster = await reverseTransferIfPossible({
    amountCents: order.roasterTotal,
    metadata: { order_id: order.id, type: "refund_reversal_roaster" },
    transferId: order.stripeTransferId,
  });
  const org = order.stripeOrgTransfer
    ? await reverseTransferIfPossible({
        amountCents: order.orgAmount,
        metadata: { order_id: order.id, type: "refund_reversal_org" },
        transferId: order.stripeOrgTransfer,
      })
    : { error: null, recoveredCents: 0 };

  const shortfall =
    order.roasterTotal -
    roaster.recoveredCents +
    (order.orgAmount - org.recoveredCents);
  if (shortfall > 0) {
    console.error(
      "refund: payout clawback shortfall — manual reconciliation needed",
      {
        order_id: order.id,
        org_recovered_cents: org.recoveredCents,
        org_reversal_error: org.error,
        roaster_recovered_cents: roaster.recoveredCents,
        roaster_reversal_error: roaster.error,
        shortfall_cents: shortfall,
      }
    );
  }
}

async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const order = await database.order.findUnique({
    select: {
      campaignId: true,
      id: true,
      orgAmount: true,
      payoutStatus: true,
      roasterTotal: true,
      status: true,
      stripeOrgTransfer: true,
      stripeTransferId: true,
    },
    where: { stripeChargeId: charge.id },
  });
  if (!order) {
    createPaymentLog({}).error("refund webhook: order not found", {
      stripe_charge_id: charge.id,
    });
    return;
  }

  const fullyRefunded = charge.refunded === true;

  // SLA auto-refund already closed this out; the resulting webhook is a confirmation.
  if (fullyRefunded && order.status === "REFUNDED") {
    return;
  }

  // Claw back funds already paid out to the roaster/org (Stripe calls — before the tx).
  const payoutAlreadyTransferred = order.payoutStatus === "TRANSFERRED";
  if (fullyRefunded && payoutAlreadyTransferred) {
    await reverseOrderTransfers(order);
  }

  await database.$transaction(async (tx) => {
    if (fullyRefunded) {
      await tx.order.update({
        // FAILED whether the payout was pending (stop it) or transferred (clawed back).
        data: { payoutStatus: "FAILED", status: "REFUNDED" },
        where: { id: order.id },
      });
      // Cancel the org's pledged share so the fundraiser total stays accurate.
      await tx.campaign.update({
        data: { totalRaised: { decrement: order.orgAmount } },
        where: { id: order.campaignId },
      });
    }

    // OrderEvent stays in the transaction with the status update (atomic refund close-out).
    await tx.orderEvent.create({
      data: {
        actorType: "SYSTEM",
        eventType: "REFUND_COMPLETED",
        orderId: order.id,
        payload: {
          amount_refunded_cents: charge.amount_refunded,
          clawback_attempted: fullyRefunded && payoutAlreadyTransferred,
          fully_refunded: fullyRefunded,
          stripe_charge_id: charge.id,
        },
      },
    });
  });
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
  let legacyEvent: Stripe.Event | null = null;
  let eventId: string;
  let eventType: string;
  const stripe = getStripe();
  const maybeV2Event =
    rawBody.includes('"v2.core.') ||
    rawBody.includes('"object":"v2.core.event"');

  try {
    if (maybeV2Event) {
      const eventNotification = stripe.parseEventNotification(
        rawBody,
        signature,
        webhookSecret
      );
      eventId = eventNotification.id;
      eventType = eventNotification.type;
    } else {
      legacyEvent = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
      eventId = legacyEvent.id;
      eventType = legacyEvent.type;
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const existing = await database.stripeEvent.findUnique({
    where: { stripeEventId: eventId },
  });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    if (V2_CONNECT_ACCOUNT_EVENT_TYPES.has(eventType)) {
      await handleV2ConnectAccountEvent(eventId);
    } else if (legacyEvent) {
      switch (legacyEvent.type) {
        case "account.updated":
          await handleAccountUpdated(legacyEvent.data.object as Stripe.Account);
          break;
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(
            legacyEvent.data.object as Stripe.PaymentIntent
          );
          break;
        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(
            legacyEvent.data.object as Stripe.PaymentIntent
          );
          break;
        case "charge.dispute.closed":
          await handleChargeDisputeClosed(
            legacyEvent.data.object as Stripe.Dispute
          );
          break;
        case "charge.dispute.created":
          await handleChargeDisputeCreated(
            legacyEvent.data.object as Stripe.Dispute
          );
          break;
        case "charge.refunded":
          await handleChargeRefunded(legacyEvent.data.object as Stripe.Charge);
          break;
        default:
          break;
      }
    }
  } catch (e) {
    createPaymentLog({}).error("stripe webhook processing failed", {
      error: e instanceof Error ? e.message : "unknown",
      event_type: eventType,
      stripe_event_id: eventId,
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  try {
    await database.stripeEvent.create({
      data: {
        stripeEventId: eventId,
        eventType,
      },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  return NextResponse.json({ received: true });
}
