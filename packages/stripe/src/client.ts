import "server-only";

import Stripe from "stripe";

let stripeSingleton: Stripe | undefined;

/**
 * Refuses live secret keys when not running in a production deployment.
 * Uses `NODE_ENV` / `VERCEL_ENV` like typical Vercel apps.
 */
export function assertStripeSecretKeyAllowed(secretKey: string): void {
  if (!secretKey.startsWith("sk_live_")) {
    return;
  }
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (!isProd) {
    throw new Error(
      "Refusing sk_live_ Stripe key: set NODE_ENV=production or VERCEL_ENV=production"
    );
  }
}

function createStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  assertStripeSecretKeyAllowed(key);
  return new Stripe(key, {
    apiVersion: "2026-02-25.clover",
  });
}

/**
 * Lazily initialized Stripe client (singleton). Throws if `STRIPE_SECRET_KEY` is missing.
 */
export function getStripe(): Stripe {
  if (!stripeSingleton) {
    stripeSingleton = createStripe();
  }
  return stripeSingleton;
}

/** True when a non-empty `STRIPE_SECRET_KEY` is present (does not validate the key). */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key);
}
