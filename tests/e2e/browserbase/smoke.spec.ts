import { expect, test } from "./fixtures";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://www.browserbase.com";
const ANY_TITLE = /.+/;

test("cloud browser loads a public page", async ({ page }) => {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  await expect(page).toHaveTitle(ANY_TITLE);
});
