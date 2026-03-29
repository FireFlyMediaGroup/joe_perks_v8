import { database } from "@joe-perks/db";
import {
  getStripe,
  mapStripeAccountToOnboardingStatus,
} from "@joe-perks/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function handleAccountUpdated(account: Stripe.Account): Promise<void> {
  const id = account.id;
  const onboarding = mapStripeAccountToOnboardingStatus(account);

  const roaster = await database.roaster.findFirst({
    where: { stripeAccountId: id },
  });
  if (roaster) {
    await database.roaster.update({
      where: { id: roaster.id },
      data: {
        chargesEnabled: account.charges_enabled ?? false,
        payoutsEnabled: account.payouts_enabled ?? false,
        stripeOnboarding: onboarding,
      },
    });
    return;
  }

  const org = await database.org.findFirst({
    where: { stripeAccountId: id },
  });
  if (org) {
    await database.org.update({
      where: { id: org.id },
      data: { stripeOnboarding: onboarding },
    });
  }
}

/** Stripe Connect + payments — verify signature, idempotency, then process (see `docs/AGENTS.md`). */
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
    if (event.type === "account.updated") {
      await handleAccountUpdated(event.data.object as Stripe.Account);
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
