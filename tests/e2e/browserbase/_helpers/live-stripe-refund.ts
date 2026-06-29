export interface RefundResult {
  chargeId: string;
  refundId: string;
  status: string;
}

function requireStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is required to refund a live smoke order.");
  }
  return key;
}

async function stripeGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${requireStripeSecretKey()}` },
  });
  const body = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(body.error?.message ?? `Stripe GET ${path} failed (${res.status})`);
  }
  return body;
}

async function stripePost<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    body: new URLSearchParams(params),
    headers: {
      Authorization: `Bearer ${requireStripeSecretKey()}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const body = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(body.error?.message ?? `Stripe POST ${path} failed (${res.status})`);
  }
  return body;
}

export async function refundPaymentIntent(
  paymentIntentId: string
): Promise<RefundResult> {
  const pi = await stripeGet<{ latest_charge?: string }>(
    `/payment_intents/${paymentIntentId}`
  );
  const chargeId = pi.latest_charge;
  if (!chargeId) {
    throw new Error(`PaymentIntent ${paymentIntentId} has no charge to refund.`);
  }

  const refund = await stripePost<{ id: string; status: string }>("/refunds", {
    charge: chargeId,
  });

  return {
    chargeId,
    refundId: refund.id,
    status: refund.status,
  };
}
