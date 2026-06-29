import { defineConfig } from "@playwright/test";
import { loadSmokeLaneEnv } from "./scripts/load-smoke-lane-env.mjs";

loadSmokeLaneEnv();

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!baseURL) {
  throw new Error(
    "PLAYWRIGHT_BASE_URL is required for live money-path smoke.\n" +
      "Example: PLAYWRIGHT_BASE_URL=https://joeperks.com JOE_PERKS_CONFIRM_LIVE_MONEY_PATH=1 pnpm test:e2e:browserbase:live-smoke"
  );
}

/**
 * Live money-path smoke (P-13 / P-14) on a public deployment.
 *
 * Tenant: internal-smoke-lane (PLAYWRIGHT_E2E_ORG_SLUG) — seed via pnpm db:seed:smoke-lane:prod
 * Guard: JOE_PERKS_CONFIRM_LIVE_MONEY_PATH=1
 * Card: LIVE_SMOKE_CARD_* for live Stripe, or LIVE_SMOKE_ALLOW_TEST_CARD=1 on test-mode previews
 * DB: DATABASE_URL prod Neon (ep-bold-field) — resolves fulfillment magic link after payment
 * Roaster: ROASTER_APP_ORIGIN (default https://roasters.joeperks.com)
 * Refund: LIVE_SMOKE_AUTO_REFUND=0 to skip immediate refund (default refunds)
 *
 * Preflight: pnpm smoke-lane:verify
 * Evidence: test-results/live-money-path-evidence.json + Browserbase session replay URL
 */
export default defineConfig({
  testDir: "./tests/e2e/browserbase",
  testMatch: ["live-money-path.spec.ts"],
  fullyParallel: false,
  retries: 0,
  timeout: 240_000,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-live-smoke" }]],
  use: {
    trace: "retain-on-failure",
    screenshot: "on",
    video: "on",
  },
  projects: [
    {
      name: "browserbase-live-smoke",
      use: {},
    },
  ],
});
