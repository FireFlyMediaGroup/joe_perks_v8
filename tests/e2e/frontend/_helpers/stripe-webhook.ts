import { getStripe } from "@joe-perks/stripe";

const WEBHOOK_PATH = "/api/webhooks/stripe";

/**
 * Build, sign, and POST a `payment_intent.succeeded` event to the webhook route
 * exactly as Stripe would — the signature is generated with the same
 * `STRIPE_WEBHOOK_SECRET` the app verifies against. This settles the money path
 * deterministically in CI without a live `stripe listen` tunnel.
 */
export async function deliverPaymentIntentSucceeded(input: {
  baseURL: string;
  orderId: string;
  paymentIntentId: string;
}): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required to sign test webhooks");
  }

  const event = {
    data: {
      object: {
        id: input.paymentIntentId,
        latest_charge: `ch_e2e_${input.paymentIntentId}`,
        metadata: { order_id: input.orderId },
        object: "payment_intent",
      },
    },
    id: `evt_e2e_${input.paymentIntentId}`,
    object: "event",
    type: "payment_intent.succeeded",
  };

  const payload = JSON.stringify(event);
  const signature = getStripe().webhooks.generateTestHeaderString({
    payload,
    secret,
  });

  return await fetch(`${input.baseURL}${WEBHOOK_PATH}`, {
    body: payload,
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    method: "POST",
  });
}
