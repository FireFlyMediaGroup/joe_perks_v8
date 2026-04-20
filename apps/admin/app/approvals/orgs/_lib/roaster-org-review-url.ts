const TRAILING_SLASH = /\/$/;

/**
 * Magic link URL for roaster org review (US-03-02 / US-03-03).
 * Uses `ROASTER_APP_ORIGIN` from env; defaults to local dev on port 3001.
 */
export function getRoasterOrgReviewUrl(token: string): string {
  const raw = process.env.ROASTER_APP_ORIGIN?.trim();
  const origin = raw && raw.length > 0 ? raw : "http://localhost:3001";
  const base = origin.replace(TRAILING_SLASH, "");
  return `${base}/org-requests/${token}`;
}
