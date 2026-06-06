import crypto from "node:crypto";

const WEBHOOK_PATH = "/api/webhooks/stripe";

function requireSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required to sign test webhooks");
  }
  return secret;
}

// Stripe scheme: t=<unix>,v1=HMAC_SHA256("<t>.<payload>", secret). Computed with
// node:crypto so the test pulls in no Stripe/workspace package (avoids
// `server-only`-guarded barrels). The app's `constructEvent` verifies it.
function signature(payload: string, secret: string): string {
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  return `t=${t},v1=${v1}`;
}

function postWebhook(
  baseURL: string,
  payload: string,
  stripeSignature: string
): Promise<Response> {
  return fetch(`${baseURL}${WEBHOOK_PATH}`, {
    body: payload,
    headers: {
      "content-type": "application/json",
      "stripe-signature": stripeSignature,
    },
    method: "POST",
  });
}

/** The charge id the webhook handler records when a PaymentIntent succeeds. */
export function chargeIdFor(paymentIntentId: string): string {
  return `ch_e2e_${paymentIntentId}`;
}

export function paymentIntentSucceededEvent(input: {
  orderId: string;
  paymentIntentId: string;
}) {
  return {
    data: {
      object: {
        id: input.paymentIntentId,
        latest_charge: chargeIdFor(input.paymentIntentId),
        metadata: { order_id: input.orderId },
        object: "payment_intent",
      },
    },
    id: `evt_e2e_pi_${input.paymentIntentId}`,
    object: "event",
    type: "payment_intent.succeeded",
  };
}

export function chargeRefundedEvent(input: {
  amountRefunded: number;
  chargeId: string;
}) {
  return {
    data: {
      object: {
        amount_refunded: input.amountRefunded,
        id: input.chargeId,
        object: "charge",
        refunded: true,
      },
    },
    id: `evt_e2e_refund_${input.chargeId}`,
    object: "event",
    type: "charge.refunded",
  };
}

/** Sign an event with the real webhook secret and POST it to the route. */
export function deliverEvent(
  baseURL: string,
  event: unknown
): Promise<Response> {
  const payload = JSON.stringify(event);
  return postWebhook(baseURL, payload, signature(payload, requireSecret()));
}

/** POST an event signed with the WRONG secret — must be rejected (EC-09). */
export function deliverEventWithBadSignature(
  baseURL: string,
  event: unknown
): Promise<Response> {
  const payload = JSON.stringify(event);
  return postWebhook(baseURL, payload, signature(payload, "whsec_e2e_wrong"));
}

/** Convenience for the MP-01 happy path. */
export function deliverPaymentIntentSucceeded(input: {
  baseURL: string;
  orderId: string;
  paymentIntentId: string;
}): Promise<Response> {
  return deliverEvent(input.baseURL, paymentIntentSucceededEvent(input));
}
