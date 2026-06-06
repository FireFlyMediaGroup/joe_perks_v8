import { database } from "@joe-perks/db/database";
import { expect, test } from "@playwright/test";

import { checkoutToPaymentStep } from "./_helpers/checkout-flow";
import { deliverPaymentIntentSucceeded } from "./_helpers/stripe-webhook";

const PAYMENT_INTENT_ID = /^pi_/;

/**
 * MP-01 — money-path happy path through settlement.
 *
 * Buyer checks out (creating a PENDING order + PaymentIntent), then a signed
 * `payment_intent.succeeded` webhook settles it. Asserts the order flips to
 * CONFIRMED with payout HELD and a PAYMENT_SUCCEEDED event — the core
 * order-creation → webhook → settlement path. Fulfillment → payout release is
 * the next scenario (MP-02), built on this same harness.
 */
test("MP-01: a paid order settles to CONFIRMED via the Stripe webhook", async ({
  page,
  baseURL,
}) => {
  const intent = await checkoutToPaymentStep(page);
  expect(intent.orderId).toBeTruthy();
  expect(intent.paymentIntentId).toMatch(PAYMENT_INTENT_ID);

  // The order is PENDING until the webhook settles it.
  const pending = await database.order.findUnique({
    select: { status: true },
    where: { id: intent.orderId },
  });
  expect(pending?.status).toBe("PENDING");

  // Drive settlement with a signed webhook (no live tunnel needed).
  const response = await deliverPaymentIntentSucceeded({
    baseURL: baseURL ?? "http://127.0.0.1:3100",
    orderId: intent.orderId,
    paymentIntentId: intent.paymentIntentId,
  });
  expect(response.status).toBe(200);

  // Settled: CONFIRMED, payout HELD, and an auditable PAYMENT_SUCCEEDED event.
  const settled = await database.order.findUnique({
    select: { payoutStatus: true, status: true },
    where: { id: intent.orderId },
  });
  expect(settled?.status).toBe("CONFIRMED");
  expect(settled?.payoutStatus).toBe("HELD");

  const event = await database.orderEvent.findFirst({
    where: { eventType: "PAYMENT_SUCCEEDED", orderId: intent.orderId },
  });
  expect(event).not.toBeNull();
});
