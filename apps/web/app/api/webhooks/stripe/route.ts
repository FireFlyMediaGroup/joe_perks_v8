import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import OrderConfirmationEmail from "@joe-perks/email/templates/order-confirmation";
import {
  getStripe,
  mapStripeAccountToOnboardingStatus,
} from "@joe-perks/stripe";
import { NextResponse } from "next/server";
import { createElement } from "react";
import type Stripe from "stripe";

export const runtime = "nodejs";

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
    select: { campaignId: true, orgAmount: true, status: true },
  });
  if (!order || order.status !== "PENDING") {
    return;
  }

  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  const chargeId =
    typeof pi.latest_charge === "string" ? pi.latest_charge : null;

  await database.$transaction([
    database.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        stripeChargeId: chargeId,
        payoutStatus: "HELD",
        payoutEligibleAt: new Date(
          Date.now() + settings.payoutHoldDays * 24 * 60 * 60 * 1000
        ),
        fulfillBy: new Date(
          Date.now() + settings.slaBreachHours * 60 * 60 * 1000
        ),
      },
    }),
    database.orderEvent.create({
      data: {
        orderId,
        eventType: "PAYMENT_SUCCEEDED",
        actorType: "SYSTEM",
        payload: { stripe_pi_id: pi.id },
      },
    }),
    database.campaign.update({
      where: { id: order.campaignId },
      data: { totalRaised: { increment: order.orgAmount } },
    }),
  ]);

  await sendBuyerOrderConfirmationEmail(orderId);
}

async function handlePaymentIntentFailed(
  pi: Stripe.PaymentIntent
): Promise<void> {
  const orderId = pi.metadata.order_id;
  if (!orderId) {
    return;
  }

  await database.orderEvent.create({
    data: {
      orderId,
      eventType: "PAYMENT_FAILED",
      actorType: "SYSTEM",
      payload: {
        stripe_pi_id: pi.id,
        failure_code: pi.last_payment_error?.code ?? null,
      },
    },
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
    }
  } catch (e) {
    console.error("stripe webhook processing failed", {
      stripe_event_id: event.id,
      event_type: event.type,
      error: e instanceof Error ? e.message : "unknown",
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  await database.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      eventType: event.type,
    },
  });

  return NextResponse.json({ received: true });
}
