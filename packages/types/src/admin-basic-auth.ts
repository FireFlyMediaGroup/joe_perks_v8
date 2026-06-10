export interface ParsedBasicAuth {
  pass: string;
  user: string;
}

/**
 * Constant-time-style string comparison. Iterates over the full length of both
 * inputs (no early exit on first mismatch) and folds length into the diff, so a
 * correct-prefix or correct-length guess is not distinguishable by timing.
 *
 * Implemented in pure JS (no `node:crypto`) on purpose: this module is part of
 * the isomorphic `@joe-perks/types` barrel that client/edge bundles import, and a
 * `node:crypto` import here would break those bundles.
 */
function safeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  // Fold any length difference in up front, then scan the full max length without
  // early-exiting, so neither a correct prefix nor a correct length is observable
  // via response timing.
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < max; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : -1;
    const cb = i < b.length ? b.charCodeAt(i) : -1;
    mismatch += ca === cb ? 0 : 1;
  }
  return mismatch === 0;
}

export interface AdminActor {
  actorLabel: string;
}

export function parseBasicAuthHeader(
  header: string | null
): ParsedBasicAuth | null {
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  try {
    const decoded = globalThis.atob(header.slice(6));
    const colon = decoded.indexOf(":");
    if (colon === -1) {
      return null;
    }

    return {
      user: decoded.slice(0, colon),
      pass: decoded.slice(colon + 1),
    };
  } catch {
    return null;
  }
}

export function getAdminBasicAuthCredentials(): {
  email: string;
  password: string;
} | null {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!(email && password)) {
    return null;
  }

  return { email, password };
}

export function getAdminActor(): AdminActor | null {
  const credentials = getAdminBasicAuthCredentials();
  if (!credentials) {
    return null;
  }

  return { actorLabel: credentials.email };
}

export function getAdminActorLabel(fallback = "platform-admin"): string {
  return getAdminActor()?.actorLabel ?? fallback;
}

export function verifyAdminBasicAuthHeader(header: string | null): boolean {
  const credentials = getAdminBasicAuthCredentials();
  if (!credentials) {
    return false;
  }

  const parsed = parseBasicAuthHeader(header);
  if (!parsed) {
    return false;
  }

  // Evaluate both comparisons unconditionally (no && short-circuit) so a correct
  // email vs. wrong email can't be distinguished by response timing.
  const userMatch = safeEqual(parsed.user, credentials.email);
  const passMatch = safeEqual(parsed.pass, credentials.password);
  return userMatch && passMatch;
}
