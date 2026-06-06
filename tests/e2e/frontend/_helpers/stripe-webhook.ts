import crypto from "node:crypto";

const WEBHOOK_PATH = "/api/webhooks/stripe";

/**
 * Build, sign, and POST a `payment_intent.succeeded` event to the webhook route
 * exactly as Stripe would. The signature uses Stripe's documented scheme —
 * `t=<unix>,v1=HMAC_SHA256("<t>.<payload>", STRIPE_WEBHOOK_SECRET)` — so the
 * app's `constructEvent` verifies it. Computed with node:crypto (no Stripe SDK
 * import) to keep the test free of `server-only`-guarded package barrels. This
 * settles the money path deterministically in CI without a live tunnel.
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
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return await fetch(`${input.baseURL}${WEBHOOK_PATH}`, {
    body: payload,
    headers: {
      "content-type": "application/json",
      "stripe-signature": `t=${timestamp},v1=${signature}`,
    },
    method: "POST",
  });
}
