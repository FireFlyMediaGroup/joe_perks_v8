import { expect, type Page } from "@playwright/test";

const FULFILL_HEADING = /fulfill this order/i;
const SHIPPED_THANK_YOU = /shipped — thank you/i;
const MARK_AS_SHIPPED = /mark as shipped/i;
const CARRIER_NAME = /carrier name/i;

export async function completeFulfillmentViaMagicLink(
  page: Page,
  fulfillUrl: string,
  orderNumber: string
): Promise<{ carrier: string; trackingNumber: string }> {
  const trackingNumber =
    process.env.LIVE_SMOKE_TRACKING_NUMBER ?? "SMOKE-TEST-TRACK-001";
  const carrier = process.env.LIVE_SMOKE_CARRIER ?? "USPS";

  await page.goto(fulfillUrl, { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { name: FULFILL_HEADING })
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(orderNumber).first()).toBeVisible();

  await page.locator('input[name="trackingNumber"]').fill(trackingNumber);

  if (carrier !== "USPS") {
    const knownCarrier =
      carrier === "UPS" || carrier === "FedEx" || carrier === "DHL"
        ? carrier
        : "Other";
    await page.locator("select").selectOption(knownCarrier);
    if (knownCarrier === "Other") {
      await page.getByRole("textbox", { name: CARRIER_NAME }).fill(carrier);
    }
  }

  await page.getByRole("button", { name: MARK_AS_SHIPPED }).click();

  await expect(page.getByText(SHIPPED_THANK_YOU)).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText(trackingNumber)).toBeVisible();

  return { carrier, trackingNumber };
}
