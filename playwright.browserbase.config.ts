import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://www.browserbase.com";

/**
 * Playwright config for Browserbase cloud browsers.
 *
 * Cloud browsers cannot reach localhost — set PLAYWRIGHT_BASE_URL to a public URL
 * (Vercel preview, staging, or production) when testing Joe Perks storefront flows.
 *
 * Usage:
 *   export BROWSERBASE_API_KEY=bb_live_...
 *   pnpm test:e2e:browserbase
 *   PLAYWRIGHT_BASE_URL=https://joeperks.com pnpm test:e2e:browserbase
 */
export default defineConfig({
  testDir: "./tests/e2e/browserbase",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "browserbase",
      use: {},
    },
  ],
});
