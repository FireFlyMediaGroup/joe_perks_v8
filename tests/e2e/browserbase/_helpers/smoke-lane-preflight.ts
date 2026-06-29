/** Keep in sync with packages/db/scripts/smoke-lane-constants.ts and assert-prod-database-url.ts */
export const DEFAULT_SMOKE_LANE_ORG_SLUG = "internal-smoke-lane";
const DEV_NEON_HOST_FRAGMENT = "ep-dark-tree";
const PROD_NEON_HOST_FRAGMENT = "ep-bold-field";

export function resolveSmokeLaneOrgSlug(): string {
  return process.env.PLAYWRIGHT_E2E_ORG_SLUG ?? DEFAULT_SMOKE_LANE_ORG_SLUG;
}

export function assertLiveSmokePreflight(): void {
  if (process.env.JOE_PERKS_CONFIRM_LIVE_MONEY_PATH !== "1") {
    throw new Error(
      "Refusing live money-path smoke: set JOE_PERKS_CONFIRM_LIVE_MONEY_PATH=1 after reading docs/runbooks/prod-smoke-lane.md."
    );
  }

  if (!process.env.PLAYWRIGHT_BASE_URL) {
    throw new Error("PLAYWRIGHT_BASE_URL is required (e.g. https://joeperks.com).");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to resolve the roaster fulfillment magic link from prod Postgres."
    );
  }

  if (process.env.LIVE_SMOKE_ALLOW_DEV_DB !== "1") {
    if (databaseUrl.includes(DEV_NEON_HOST_FRAGMENT)) {
      throw new Error(
        `Refusing: DATABASE_URL targets dev Neon (${DEV_NEON_HOST_FRAGMENT}). ` +
          `Point at prod (${PROD_NEON_HOST_FRAGMENT}) or set LIVE_SMOKE_ALLOW_DEV_DB=1 for debugging.`
      );
    }
    if (
      process.env.LIVE_SMOKE_REQUIRE_PROD_NEON !== "0" &&
      !databaseUrl.includes(PROD_NEON_HOST_FRAGMENT)
    ) {
      throw new Error(
        `DATABASE_URL does not contain expected prod host (${PROD_NEON_HOST_FRAGMENT}).`
      );
    }
  }

  const orgSlug = resolveSmokeLaneOrgSlug();
  if (
    process.env.LIVE_SMOKE_REQUIRE_SMOKE_LANE_SLUG !== "0" &&
    orgSlug !== DEFAULT_SMOKE_LANE_ORG_SLUG
  ) {
    throw new Error(
      `PLAYWRIGHT_E2E_ORG_SLUG must be "${DEFAULT_SMOKE_LANE_ORG_SLUG}" for pre-beta prod smoke ` +
        `(got "${orgSlug}"). Set LIVE_SMOKE_REQUIRE_SMOKE_LANE_SLUG=0 to override.`
    );
  }

  if (orgSlug === "e2e-test-org") {
    throw new Error(
      'Refusing: "e2e-test-org" is the local E2E fixture slug — use internal-smoke-lane on production.'
    );
  }
}
