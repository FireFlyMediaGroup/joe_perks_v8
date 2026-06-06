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
  // Override the event id to simulate a *distinct* delivery (e.g. an out-of-order
  // retry, EC-08). Defaults to a stable id derived from the PI.
  eventId?: string;
  // Real Stripe charge id (from confirming the PI) — MP-02 needs this so the
  // payout job's `source_transaction` references a real charge. Defaults to the
  // synthetic id for scenarios that don't transfer (MP-01, EC-*).
  latestCharge?: string;
  orderId: string;
  paymentIntentId: string;
}) {
  return {
    data: {
      object: {
        id: input.paymentIntentId,
        latest_charge: input.latestCharge ?? chargeIdFor(input.paymentIntentId),
        metadata: { order_id: input.orderId },
        object: "payment_intent",
      },
    },
    id: input.eventId ?? `evt_e2e_pi_${input.paymentIntentId}`,
    object: "event",
    type: "payment_intent.succeeded",
  };
}

/**
 * Confirm a real (test-mode) PaymentIntent with the standard test card so a real
 * charge exists — required for MP-02's payout `source_transaction`. Returns the
 * charge id. Uses the Stripe REST API directly (test secret key from env).
 */
export async function confirmPaymentIntent(
  paymentIntentId: string
): Promise<string> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is required to confirm a PaymentIntent");
  }
  const res = await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/confirm`,
    {
      body: new URLSearchParams({
        payment_method: "pm_card_visa",
        return_url: "https://joeperks.com",
      }).toString(),
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    }
  );
  const pi = (await res.json()) as {
    error?: { message?: string };
    latest_charge?: string;
    status?: string;
  };
  if (!(res.ok && pi.status === "succeeded" && pi.latest_charge)) {
    throw new Error(
      `PaymentIntent confirm failed: ${pi.error?.message ?? pi.status ?? res.status}`
    );
  }
  return pi.latest_charge;
}

export function chargeRefundedEvent(input: {
  amountRefunded: number;
  chargeId: string;
  // `false` = partial refund (charge not fully refunded) — order should stay
  // CONFIRMED (EC-13). Defaults to a full refund (EC-12).
  fullyRefunded?: boolean;
}) {
  const fullyRefunded = input.fullyRefunded ?? true;
  return {
    data: {
      object: {
        amount_refunded: input.amountRefunded,
        id: input.chargeId,
        object: "charge",
        refunded: fullyRefunded,
      },
    },
    id: `evt_e2e_refund_${fullyRefunded ? "full" : "partial"}_${input.chargeId}`,
    object: "event",
    type: "charge.refunded",
  };
}

export function chargeDisputeCreatedEvent(input: {
  amount: number;
  chargeId: string;
}) {
  return {
    data: {
      object: {
        amount: input.amount,
        charge: input.chargeId,
        currency: "usd",
        evidence_details: {
          due_by: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
        },
        id: `dp_e2e_${input.chargeId}`,
        object: "dispute",
        reason: "fraudulent",
        status: "warning_needs_response",
      },
    },
    id: `evt_e2e_dispute_${input.chargeId}`,
    object: "event",
    type: "charge.dispute.created",
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
