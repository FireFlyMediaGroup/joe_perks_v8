import { expect, type Page } from "@playwright/test";

const CHECKOUT_HEADING = /^checkout$/i;
const CONTINUE_TO_SHIPPING = /continue to shipping/i;
const SHIPPING_AND_CONTACT = /shipping & contact/i;
const FULL_NAME = /full name/i;
const EMAIL = /^email$/i;
const STREET_ADDRESS = /street address/i;
const APT_SUITE_ETC = /apt, suite, etc/i;
const CITY = /^city$/i;
const STATE = /^state$/i;
const ZIP_POSTAL_CODE = /zip \/ postal code/i;
const CONTINUE_TO_PAYMENT = /continue to payment/i;
export const PAY_BUTTON_PATTERN = /^pay \$/i;
const ADD_TO_CART = /add to cart/i;
const SHOPPING_CART = /shopping cart/i;
const CHECKOUT_LINK = /checkout/i;
const CART_WITH_ITEMS = /shopping cart, [1-9]\d* items/i;
const MORNING_SUNRISE_BLEND = /morning sunrise blend/i;
const TRAILING_SLASH = /\/$/;

export function requireBaseUrl(): string {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseURL) {
    throw new Error("PLAYWRIGHT_BASE_URL is required.");
  }
  return baseURL.replace(TRAILING_SLASH, "");
}

export function storefrontUrl(orgSlug: string): string {
  return new URL(`/${orgSlug}`, `${requireBaseUrl()}/`).href;
}

export async function openStorefrontWithCart(
  page: Page,
  orgSlug: string
): Promise<void> {
  await page.goto(storefrontUrl(orgSlug), { waitUntil: "networkidle" });
  await expect(page).toHaveURL(new RegExp(orgSlug.replace(/-/g, "\\-")));
  await expect(
    page.getByRole("heading", { name: MORNING_SUNRISE_BLEND }).first()
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: ADD_TO_CART }).first().click();
  await expect(page.getByRole("button", { name: SHOPPING_CART })).toHaveAttribute(
    "aria-label",
    CART_WITH_ITEMS
  );
}

export async function completeCheckoutThroughPaymentStep(
  page: Page,
  buyer: { email: string; name: string }
): Promise<void> {
  await page.getByRole("button", { name: SHOPPING_CART }).click();
  await page.getByRole("link", { name: CHECKOUT_LINK }).click();
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", { name: CHECKOUT_HEADING })
  ).toBeVisible();
  await page.getByRole("button", { name: CONTINUE_TO_SHIPPING }).click();
  await expect(
    page.getByRole("heading", { name: SHIPPING_AND_CONTACT })
  ).toBeVisible();

  await page.getByLabel(FULL_NAME).fill(buyer.name);
  await page.getByLabel(EMAIL).fill(buyer.email);
  await page.getByLabel(STREET_ADDRESS).fill("123 Brew St");
  await page.getByLabel(APT_SUITE_ETC).fill("Suite 4");
  await page.getByLabel(CITY).fill("Austin");
  await page.getByLabel(STATE).fill("TX");
  await page.getByLabel(ZIP_POSTAL_CODE).fill("78701");
  await page.getByRole("button", { name: CONTINUE_TO_PAYMENT }).click();
  await expect(page.getByRole("button", { name: PAY_BUTTON_PATTERN })).toBeVisible({
    timeout: 30_000,
  });
}

export const THANK_YOU = /thank you!/i;
export const PAYMENT_INTENT_IN_URL = /\/order\/(pi_[^/?#]+)/;
