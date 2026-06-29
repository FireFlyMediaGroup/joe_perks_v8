/** Neon host fragments — see docs/runbooks/sandbox-to-production-cutover.md */
export const DEV_NEON_HOST_FRAGMENT = "ep-dark-tree";
export const PROD_NEON_HOST_FRAGMENT = "ep-bold-field";

export function assertProdDatabaseUrl(url = process.env.DATABASE_URL): void {
  if (!url) {
    throw new Error("DATABASE_URL is required.");
  }

  if (process.env.LIVE_SMOKE_ALLOW_DEV_DB === "1") {
    return;
  }

  if (url.includes(DEV_NEON_HOST_FRAGMENT)) {
    throw new Error(
      `Refusing: DATABASE_URL targets dev Neon (${DEV_NEON_HOST_FRAGMENT}). ` +
        `Use production Neon (${PROD_NEON_HOST_FRAGMENT}) for smoke lane work. ` +
        "Set LIVE_SMOKE_ALLOW_DEV_DB=1 only for local debugging."
    );
  }

  if (
    process.env.LIVE_SMOKE_REQUIRE_PROD_NEON !== "0" &&
    !url.includes(PROD_NEON_HOST_FRAGMENT)
  ) {
    throw new Error(
      `DATABASE_URL does not contain expected prod host (${PROD_NEON_HOST_FRAGMENT}). ` +
        "Set LIVE_SMOKE_REQUIRE_PROD_NEON=0 to override."
    );
  }
}
