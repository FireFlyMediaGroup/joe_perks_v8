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

// ── Roaster application rate limiter (3 req/hr per IP) ───────────────

const APP_PREFIX = "jp:roaster-apply";
const APP_LIMIT = 3;
const APP_WINDOW = "1 h";

let appLimiterSingleton: Ratelimit | undefined;
let appLimiterUnavailable = false;

function getAppLimiter(): Ratelimit | null {
  if (appLimiterUnavailable) {
    return null;
  }
  if (appLimiterSingleton) {
    return appLimiterSingleton;
  }
  if (!hasUpstashEnv()) {
    appLimiterUnavailable = true;
    return null;
  }
  const redis = Redis.fromEnv();
  appLimiterSingleton = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(APP_LIMIT, APP_WINDOW),
    prefix: APP_PREFIX,
  });
  return appLimiterSingleton;
}

/**
 * Runs roaster-application rate limit when Redis is configured; otherwise allows the request.
 */
export async function limitRoasterApplication(identifier: string): Promise<{
  success: boolean;
}> {
  const limiter = getAppLimiter();
  if (!limiter) {
    return { success: true };
  }
  const { success } = await limiter.limit(identifier);
  return { success };
}

// ── Org application rate limiter (3 req/hr per IP) ───────────────────

const ORG_APP_PREFIX = "jp:org-apply";
const ORG_APP_LIMIT = 3;
const ORG_APP_WINDOW = "1 h";

let orgAppLimiterSingleton: Ratelimit | undefined;
let orgAppLimiterUnavailable = false;

function getOrgAppLimiter(): Ratelimit | null {
  if (orgAppLimiterUnavailable) {
    return null;
  }
  if (orgAppLimiterSingleton) {
    return orgAppLimiterSingleton;
  }
  if (!hasUpstashEnv()) {
    orgAppLimiterUnavailable = true;
    return null;
  }
  const redis = Redis.fromEnv();
  orgAppLimiterSingleton = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(ORG_APP_LIMIT, ORG_APP_WINDOW),
    prefix: ORG_APP_PREFIX,
  });
  return orgAppLimiterSingleton;
}

/**
 * Runs org-application rate limit when Redis is configured; otherwise allows the request.
 */
export async function limitOrgApplication(identifier: string): Promise<{
  success: boolean;
}> {
  const limiter = getOrgAppLimiter();
  if (!limiter) {
    return { success: true };
  }
  const { success } = await limiter.limit(identifier);
  return { success };
}

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

// ── Buyer auth rate limiter (5 req/hr per IP) ────────────────────────

const BUYER_AUTH_PREFIX = "jp:buyer-auth";
const BUYER_AUTH_LIMIT = 5;
const BUYER_AUTH_WINDOW = "1 h";

let buyerAuthLimiterSingleton: Ratelimit | undefined;
let buyerAuthLimiterUnavailable = false;

function getBuyerAuthLimiter(): Ratelimit | null {
  if (buyerAuthLimiterUnavailable) {
    return null;
  }
  if (buyerAuthLimiterSingleton) {
    return buyerAuthLimiterSingleton;
  }
  if (!hasUpstashEnv()) {
    buyerAuthLimiterUnavailable = true;
    return null;
  }
  const redis = Redis.fromEnv();
  buyerAuthLimiterSingleton = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(BUYER_AUTH_LIMIT, BUYER_AUTH_WINDOW),
    prefix: BUYER_AUTH_PREFIX,
  });
  return buyerAuthLimiterSingleton;
}

/**
 * Runs buyer-auth rate limit when Redis is configured; otherwise allows the request.
 */
export async function limitBuyerAuth(identifier: string): Promise<{
  success: boolean;
}> {
  const limiter = getBuyerAuthLimiter();
  if (!limiter) {
    return { success: true };
  }
  const { success } = await limiter.limit(identifier);
  return { success };
}

// ── Guest order-lookup rate limiter (5 req/hr per IP) ─────────────────

const GUEST_ORDER_LOOKUP_PREFIX = "jp:guest-order-lookup";
const GUEST_ORDER_LOOKUP_LIMIT = 5;
const GUEST_ORDER_LOOKUP_WINDOW = "1 h";

let guestOrderLookupLimiterSingleton: Ratelimit | undefined;
let guestOrderLookupLimiterUnavailable = false;

function getGuestOrderLookupLimiter(): Ratelimit | null {
  if (guestOrderLookupLimiterUnavailable) {
    return null;
  }
  if (guestOrderLookupLimiterSingleton) {
    return guestOrderLookupLimiterSingleton;
  }
  if (!hasUpstashEnv()) {
    guestOrderLookupLimiterUnavailable = true;
    return null;
  }
  const redis = Redis.fromEnv();
  guestOrderLookupLimiterSingleton = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      GUEST_ORDER_LOOKUP_LIMIT,
      GUEST_ORDER_LOOKUP_WINDOW
    ),
    prefix: GUEST_ORDER_LOOKUP_PREFIX,
  });
  return guestOrderLookupLimiterSingleton;
}

/**
 * Runs guest order-lookup rate limit when Redis is configured; otherwise allows the request.
 */
export async function limitGuestOrderLookup(identifier: string): Promise<{
  success: boolean;
}> {
  const limiter = getGuestOrderLookupLimiter();
  if (!limiter) {
    return { success: true };
  }
  const { success } = await limiter.limit(identifier);
  return { success };
}
