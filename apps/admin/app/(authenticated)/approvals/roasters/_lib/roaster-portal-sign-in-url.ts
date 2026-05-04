const TRAILING_SLASH = /\/$/;

/**
 * Public roaster app sign-in URL for approval emails (US-02-02).
 * Uses `ROASTER_APP_ORIGIN` from env (see `docs/AGENTS.md`); defaults to local dev.
 */
export function getRoasterPortalSignInUrl(): string {
  const raw = process.env.ROASTER_APP_ORIGIN?.trim();
  const origin = raw && raw.length > 0 ? raw : "http://localhost:3001";
  return `${origin.replace(TRAILING_SLASH, "")}/sign-in`;
}
