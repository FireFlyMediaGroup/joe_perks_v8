import { expect, test } from "@playwright/test";

import { checkoutToPaymentStep } from "./_helpers/checkout-flow";
import { deliverPaymentIntentSucceeded } from "./_helpers/stripe-webhook";

const PAYMENT_INTENT_ID = /^pi_/;
const FALLBACK_BASE_URL = "http://127.0.0.1:3100";

async function fetchOrderStatus(
  baseURL: string,
  paymentIntentId: string
): Promise<string> {
  const res = await fetch(
    `${baseURL}/api/order-status?pi=${encodeURIComponent(paymentIntentId)}`
  );
  expect(res.ok).toBeTruthy();
  const body = (await res.json()) as { status: string };
  return body.status;
}

/**
 * MP-01 — money-path happy path through settlement.
 *
 * Buyer checks out (creating a PENDING order + PaymentIntent), then a signed
 * `payment_intent.succeeded` webhook settles it. Asserts the order flips
 * PENDING → CONFIRMED via the app's own order-status API (black-box; no DB import
 * in the test) — the core order-creation → webhook → settlement path.
 * Fulfillment → payout release is the next scenario (MP-02) on this harness.
 */
test("MP-01: a paid order settles to CONFIRMED via the Stripe webhook", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;

  const intent = await checkoutToPaymentStep(page);
  expect(intent.orderId).toBeTruthy();
  expect(intent.paymentIntentId).toMatch(PAYMENT_INTENT_ID);

  // The order is PENDING until the webhook settles it.
  expect(await fetchOrderStatus(base, intent.paymentIntentId)).toBe("PENDING");

  // Drive settlement with a signed webhook (no live tunnel needed).
  const response = await deliverPaymentIntentSucceeded({
    baseURL: base,
    orderId: intent.orderId,
    paymentIntentId: intent.paymentIntentId,
  });
  expect(response.status).toBe(200);

  // Settled: the order flips to CONFIRMED.
  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: 15_000,
    })
    .toBe("CONFIRMED");
});
