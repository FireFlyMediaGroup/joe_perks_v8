const TRAILING_SLASH = /\/$/;

/**
 * Public org app sign-in URL for roaster-approval emails (US-03-03).
 * Uses `ORG_APP_ORIGIN` from env; defaults to local dev on port 3002.
 */
export function getOrgPortalSignInUrl(): string {
  const raw = process.env.ORG_APP_ORIGIN?.trim();
  const origin = raw && raw.length > 0 ? raw : "http://localhost:3002";
  return `${origin.replace(TRAILING_SLASH, "")}/sign-in`;
}
