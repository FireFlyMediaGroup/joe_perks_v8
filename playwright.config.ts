import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const e2eIp =
  process.env.PLAYWRIGHT_E2E_IP ?? `203.0.113.${(Date.now() % 200) + 20}`;

export default defineConfig({
  testDir: "./tests/e2e/frontend",
  fullyParallel: false,
  globalSetup: "./tests/e2e/frontend/global-setup.ts",
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: {
      "x-forwarded-for": e2eIp,
      "x-real-ip": e2eIp,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "node ./scripts/playwright-web-server.mjs",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
