import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!baseURL) {
  throw new Error(
    "PLAYWRIGHT_BASE_URL is required for Browserbase storefront preview tests.\n" +
      "Example: PLAYWRIGHT_BASE_URL=https://joe-perks-4sc8ri9pp-fireflymediagroups-projects.vercel.app pnpm test:e2e:browserbase:storefront"
  );
}

/**
 * Browserbase + Joe Perks storefront tests against a public Vercel preview URL.
 *
 * Prerequisites:
 * - Preview deployment must have E2E seed data (`e2e-test-org` org slug).
 * - Set BROWSERBASE_API_KEY and PLAYWRIGHT_BASE_URL (no trailing slash).
 *
 * Watch runs live: https://www.browserbase.com/sessions
 */
export default defineConfig({
  testDir: "./tests/e2e/browserbase",
  testMatch: ["storefront-preview.spec.ts"],
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "browserbase-storefront",
      use: {},
    },
  ],
});
