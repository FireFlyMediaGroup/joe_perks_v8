import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const CHECKOUT_PREFIX = "jp:checkout";
const CHECKOUT_LIMIT = 5;
const CHECKOUT_WINDOW = "1 h";

let checkoutLimiterSingleton: Ratelimit | undefined;
let checkoutLimiterUnavailable = false;

function hasUpstashEnv(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return Boolean(url && token);
}

/**
 * Sliding-window limiter for checkout / payment attempts (5 per hour per IP by default).
 * Returns `null` when Upstash env vars are not set — callers should skip limiting in that case
 * (typical local dev without Redis).
 */
export function getCheckoutLimiter(): Ratelimit | null {
  if (checkoutLimiterUnavailable) {
    return null;
  }
  if (checkoutLimiterSingleton) {
    return checkoutLimiterSingleton;
  }
  if (!hasUpstashEnv()) {
    checkoutLimiterUnavailable = true;
    return null;
  }
  const redis = Redis.fromEnv();
  checkoutLimiterSingleton = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(CHECKOUT_LIMIT, CHECKOUT_WINDOW),
    prefix: CHECKOUT_PREFIX,
  });
  return checkoutLimiterSingleton;
}

/** True when Upstash credentials are present and a limiter can be built. */
export function isCheckoutRateLimitConfigured(): boolean {
  return hasUpstashEnv();
}

/**
 * Runs checkout rate limit when Redis is configured; otherwise allows the request.
 */
export async function limitCheckout(identifier: string): Promise<{
  success: boolean;
}> {
  const limiter = getCheckoutLimiter();
  if (!limiter) {
    return { success: true };
  }
  const { success } = await limiter.limit(identifier);
  return { success };
}

/**
 * Upstash-backed limiter when env is configured; otherwise `limit()` always succeeds.
 * Matches the `checkoutLimiter.limit(ip)` pattern in `docs/AGENTS.md`.
 */
export const checkoutLimiter = {
  limit(identifier: string) {
    const limiter = getCheckoutLimiter();
    if (!limiter) {
      return Promise.resolve({
        success: true,
        limit: CHECKOUT_LIMIT,
        remaining: CHECKOUT_LIMIT,
        reset: Date.now() + 3_600_000,
      });
    }
    return limiter.limit(identifier);
  },
};

// ── Slug validation rate limiter (30 req/min per IP) ─────────────────

const SLUG_PREFIX = "jp:slug-validate";
const SLUG_LIMIT = 30;
const SLUG_WINDOW = "1 m";

let slugLimiterSingleton: Ratelimit | undefined;
let slugLimiterUnavailable = false;

function getSlugLimiter(): Ratelimit | null {
  if (slugLimiterUnavailable) {
    return null;
  }
  if (slugLimiterSingleton) {
    return slugLimiterSingleton;
  }
  if (!hasUpstashEnv()) {
    slugLimiterUnavailable = true;
    return null;
  }
  const redis = Redis.fromEnv();
  slugLimiterSingleton = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(SLUG_LIMIT, SLUG_WINDOW),
    prefix: SLUG_PREFIX,
  });
  return slugLimiterSingleton;
}

/**
 * Runs slug-validation rate limit when Redis is configured; otherwise allows the request.
 */
export async function limitSlugValidation(identifier: string): Promise<{
  success: boolean;
}> {
  const limiter = getSlugLimiter();
  if (!limiter) {
    return { success: true };
  }
  const { success } = await limiter.limit(identifier);
  return { success };
}
