import { expect, test } from "@playwright/test";

import { checkoutToPaymentStep } from "./_helpers/checkout-flow";
import {
  chargeIdFor,
  chargeRefundedEvent,
  confirmPaymentIntent,
  deliverEvent,
  deliverEventWithBadSignature,
  deliverPaymentIntentSucceeded,
  paymentIntentSucceededEvent,
} from "./_helpers/stripe-webhook";

const PAYMENT_INTENT_ID = /^pi_/;
const FALLBACK_BASE_URL = "http://127.0.0.1:3100";
const SETTLE_TIMEOUT = 15_000;

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
 * Money-path e2e against the app's own APIs (black-box; no DB or workspace
 * imports). Order state is asserted via GET /api/order-status?pi=…; settlement,
 * refund, and signature events are driven by signed webhooks (no live tunnel).
 * Fulfillment → payout release (MP-02) needs real Stripe test Connect accounts
 * and is tracked separately.
 */
test("MP-01: a paid order settles to CONFIRMED via the Stripe webhook", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;

  const intent = await checkoutToPaymentStep(page);
  expect(intent.orderId).toBeTruthy();
  expect(intent.paymentIntentId).toMatch(PAYMENT_INTENT_ID);

  expect(await fetchOrderStatus(base, intent.paymentIntentId)).toBe("PENDING");

  const response = await deliverPaymentIntentSucceeded({
    baseURL: base,
    orderId: intent.orderId,
    paymentIntentId: intent.paymentIntentId,
  });
  expect(response.status).toBe(200);

  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("CONFIRMED");
});

test("EC-09: a webhook with an invalid signature is rejected and does not settle", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;
  const intent = await checkoutToPaymentStep(page);

  const response = await deliverEventWithBadSignature(
    base,
    paymentIntentSucceededEvent(intent)
  );

  // Signature verification fails → 400, and the order is untouched.
  expect(response.status).toBe(400);
  expect(await fetchOrderStatus(base, intent.paymentIntentId)).toBe("PENDING");
});

test("EC-07: a duplicate webhook is a no-op (order stays CONFIRMED)", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;
  const intent = await checkoutToPaymentStep(page);
  const event = paymentIntentSucceededEvent(intent);

  expect((await deliverEvent(base, event)).status).toBe(200);
  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("CONFIRMED");

  // Same event.id again — deduped by the StripeEvent unique constraint.
  const duplicate = await deliverEvent(base, event);
  expect(duplicate.status).toBe(200);
  expect(await fetchOrderStatus(base, intent.paymentIntentId)).toBe(
    "CONFIRMED"
  );
});

test("EC-12: charge.refunded flips a confirmed order to REFUNDED", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;
  const intent = await checkoutToPaymentStep(page);

  expect(
    (
      await deliverPaymentIntentSucceeded({
        baseURL: base,
        orderId: intent.orderId,
        paymentIntentId: intent.paymentIntentId,
      })
    ).status
  ).toBe(200);
  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("CONFIRMED");

  const refund = await deliverEvent(
    base,
    chargeRefundedEvent({
      amountRefunded: intent.grossAmount,
      chargeId: chargeIdFor(intent.paymentIntentId),
    })
  );
  expect(refund.status).toBe(200);

  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("REFUNDED");
});

test("EC-08: a payment_intent.succeeded after a refund does not un-refund the order", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;
  const intent = await checkoutToPaymentStep(page);

  // Settle, then fully refund.
  expect(
    (
      await deliverPaymentIntentSucceeded({
        baseURL: base,
        orderId: intent.orderId,
        paymentIntentId: intent.paymentIntentId,
      })
    ).status
  ).toBe(200);
  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("CONFIRMED");

  expect(
    (
      await deliverEvent(
        base,
        chargeRefundedEvent({
          amountRefunded: intent.grossAmount,
          chargeId: chargeIdFor(intent.paymentIntentId),
        })
      )
    ).status
  ).toBe(200);
  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("REFUNDED");

  // A late/retried succeeded (distinct event id, so not just deduped) must not
  // resurrect the order — the confirm only applies to PENDING orders.
  const late = await deliverEvent(
    base,
    paymentIntentSucceededEvent({
      eventId: `evt_e2e_pi_reorder_${intent.paymentIntentId}`,
      orderId: intent.orderId,
      paymentIntentId: intent.paymentIntentId,
    })
  );
  expect(late.status).toBe(200);
  expect(await fetchOrderStatus(base, intent.paymentIntentId)).toBe("REFUNDED");
});

test("EC-13: a partial refund leaves the order CONFIRMED", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;
  const intent = await checkoutToPaymentStep(page);

  expect(
    (
      await deliverPaymentIntentSucceeded({
        baseURL: base,
        orderId: intent.orderId,
        paymentIntentId: intent.paymentIntentId,
      })
    ).status
  ).toBe(200);
  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("CONFIRMED");

  // Partial (shipping-only) refund: charge not fully refunded → status unchanged.
  const partial = await deliverEvent(
    base,
    chargeRefundedEvent({
      amountRefunded: 595,
      chargeId: chargeIdFor(intent.paymentIntentId),
      fullyRefunded: false,
    })
  );
  expect(partial.status).toBe(200);
  expect(await fetchOrderStatus(base, intent.paymentIntentId)).toBe(
    "CONFIRMED"
  );
});

test("MP-02: a delivered order pays out to the roaster + org (TRANSFERRED)", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? FALLBACK_BASE_URL;
  const intent = await checkoutToPaymentStep(page);

  // Real test-mode charge so the payout job's source_transaction is valid.
  const chargeId = await confirmPaymentIntent(intent.paymentIntentId);

  const settle = await deliverEvent(
    base,
    paymentIntentSucceededEvent({
      latestCharge: chargeId,
      orderId: intent.orderId,
      paymentIntentId: intent.paymentIntentId,
    })
  );
  expect(settle.status).toBe(200);
  await expect
    .poll(() => fetchOrderStatus(base, intent.paymentIntentId), {
      timeout: SETTLE_TIMEOUT,
    })
    .toBe("CONFIRMED");

  // Drive to DELIVERED + past hold, then run the payout-release job (gated route).
  const release = await fetch(`${base}/api/e2e/release-payout`, {
    body: JSON.stringify({ orderId: intent.orderId }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(release.ok).toBeTruthy();
  const result = (await release.json()) as {
    failure: unknown;
    payoutStatus: string;
    roasterTransferId: string | null;
  };

  // Transfers to the roaster + org connected accounts succeeded.
  expect(
    result.payoutStatus,
    `payout did not transfer; failure=${JSON.stringify(result.failure)}`
  ).toBe("TRANSFERRED");
  expect(result.roasterTransferId).toBeTruthy();
});
