import Browserbase from "@browserbasehq/sdk";
import { test as base } from "@playwright/test";

function requireBrowserbaseApiKey(): string {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BROWSERBASE_API_KEY is required. Set it in the environment before running Browserbase E2E tests."
    );
  }
  return apiKey;
}

/** Latest session replay URL for the active test worker (evidence reports). */
let activeBrowserbaseSessionUrl = "";

export function getBrowserbaseSessionUrl(): string {
  return activeBrowserbaseSessionUrl;
}

export const test = base.extend({
  browser: async ({ playwright }, use, testInfo) => {
    const bb = new Browserbase({ apiKey: requireBrowserbaseApiKey() });
    const session = await bb.sessions.create({
      userMetadata: {
        project: "joe-perks",
        suite: testInfo.project.name,
        testName: testInfo.title,
      },
    });

    const sessionUrl = `https://www.browserbase.com/sessions/${session.id}`;
    activeBrowserbaseSessionUrl = sessionUrl;
    console.log(`Browserbase Live View: ${sessionUrl}`);

    const browser = await playwright.chromium.connectOverCDP(
      session.connectUrl
    );
    await use(browser);
    await browser.close();
  },

  context: async ({ browser }, use) => {
    const context = browser.contexts()[0];
    if (!context) {
      throw new Error(
        "Browserbase CDP connection did not provide a default browser context"
      );
    }
    await use(context);
  },

  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

export { expect } from "@playwright/test";
