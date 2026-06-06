/*
 * PII scrubbing for Sentry events.
 *
 * Joe Perks handles buyer PII on the money path (emails, names, shipping addresses,
 * IPs). The launch runbook's Phase B.4 abort criterion is "Buyer PII appears
 * unscrubbed in any Sentry event" — this module is the mechanism that keeps that
 * from happening. It is pure and has no runtime dependency on the Sentry SDK
 * (types only), so it is safe to import from the server, edge, and dynamically
 * loaded client configs.
 *
 * Wire it in via `Sentry.init({ beforeSend: scrubEvent, sendDefaultPii: false })`.
 */

import type { ErrorEvent } from "@sentry/nextjs";

const REDACTED = "[redacted]";

// Conservative email matcher — redacted inline wherever a string carries one.
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * Keys whose *values* are PII regardless of where they appear (request bodies,
 * `extra`, breadcrumb data, captured stack-frame locals). Compared case- and
 * separator-insensitively, so `buyer_email`, `buyerEmail`, and `BuyerEmail`
 * all match `buyeremail`.
 */
const PII_KEY_FRAGMENTS = [
  "email",
  "name", // buyerName, fullName, recipientName, ...
  "phone",
  "address",
  "street",
  "line1",
  "line2",
  "postalcode",
  "postal",
  "zip",
  "ipaddress",
  "buyerip",
  "clientip",
  "password",
  "secret",
  "token",
  "apikey",
  "authorization",
  "cookie",
  "clientsecret",
];

// Header names stripped wholesale from request contexts.
const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-clerk-auth-token",
  "stripe-signature",
]);

const MAX_DEPTH = 8;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isPiiKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return PII_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function redactString(value: string): string {
  return value.replace(EMAIL_RE, REDACTED);
}

/**
 * Recursively redacts PII-keyed values and inline emails. Mutates in place and
 * also returns the value for convenience. Depth-limited and cycle-safe.
 */
function deepScrub(value: unknown, depth = 0, seen = new WeakSet()): unknown {
  if (value == null || depth > MAX_DEPTH) {
    return value;
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = deepScrub(value[i], depth + 1, seen);
    }
    return value;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (isPiiKey(key)) {
      record[key] = REDACTED;
      continue;
    }
    record[key] = deepScrub(record[key], depth + 1, seen);
  }
  return record;
}

function scrubRequest(request: NonNullable<ErrorEvent["request"]>): void {
  request.cookies = undefined;
  if (request.headers) {
    for (const headerName of Object.keys(request.headers)) {
      if (SENSITIVE_HEADERS.has(headerName.toLowerCase())) {
        request.headers[headerName] = REDACTED;
      }
    }
  }
  if (typeof request.query_string === "string") {
    request.query_string = redactString(request.query_string);
  }
  if (request.data != null) {
    request.data = deepScrub(request.data);
  }
}

function scrubException(
  exceptions: NonNullable<NonNullable<ErrorEvent["exception"]>["values"]>
): void {
  for (const exception of exceptions) {
    if (typeof exception.value === "string") {
      exception.value = redactString(exception.value);
    }
    const frames = exception.stacktrace?.frames;
    if (!frames) {
      continue;
    }
    for (const frame of frames) {
      if (frame.vars) {
        frame.vars = deepScrub(frame.vars) as Record<string, unknown>;
      }
    }
  }
}

function scrubBreadcrumbs(
  breadcrumbs: NonNullable<ErrorEvent["breadcrumbs"]>
): void {
  for (const crumb of breadcrumbs) {
    if (typeof crumb.message === "string") {
      crumb.message = redactString(crumb.message);
    }
    if (crumb.data) {
      crumb.data = deepScrub(crumb.data) as Record<string, unknown>;
    }
  }
}

/**
 * Sentry `beforeSend` hook. Strips identifying user fields, sensitive request
 * headers/cookies/body, captured stack-frame locals, breadcrumb data, and inline
 * emails from messages and exception values. Returns the scrubbed event.
 */
export function scrubEvent(sentryEvent: ErrorEvent): ErrorEvent {
  // User identity: keep an opaque id for correlation, drop everything personal.
  if (sentryEvent.user) {
    sentryEvent.user = { id: sentryEvent.user.id };
  }

  if (sentryEvent.request) {
    scrubRequest(sentryEvent.request);
  }

  // Inline emails in the top-level message.
  if (typeof sentryEvent.message === "string") {
    sentryEvent.message = redactString(sentryEvent.message);
  }

  if (sentryEvent.exception?.values) {
    scrubException(sentryEvent.exception.values);
  }

  if (sentryEvent.breadcrumbs) {
    scrubBreadcrumbs(sentryEvent.breadcrumbs);
  }

  // Arbitrary attached context.
  if (sentryEvent.extra) {
    sentryEvent.extra = deepScrub(sentryEvent.extra) as Record<string, unknown>;
  }
  if (sentryEvent.contexts) {
    sentryEvent.contexts = deepScrub(
      sentryEvent.contexts
    ) as typeof sentryEvent.contexts;
  }

  return sentryEvent;
}
