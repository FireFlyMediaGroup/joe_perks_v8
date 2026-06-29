import { expect, test } from "./fixtures";

const ORG_SLUG = process.env.PLAYWRIGHT_E2E_ORG_SLUG ?? "e2e-test-org";
const STOREFRONT_PATH = `/${ORG_SLUG}`;

function requireBaseUrl(): string {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseURL) {
    throw new Error("PLAYWRIGHT_BASE_URL is required");
  }
  return baseURL.replace(TRAILING_SLASH, "");
}

function storefrontUrl(path = STOREFRONT_PATH): string {
  return new URL(path, `${requireBaseUrl()}/`).href;
}

const MORNING_SUNRISE_BLEND = /morning sunrise blend/i;
const SHOPPING_CART = /shopping cart/i;
const CART_WITH_ITEMS = /shopping cart, [1-9]\d* items/i;
const YOUR_CART = /your cart/i;
const E2E_TEST_ORGANIZATION = /e2e test organization/i;
const COFFEE_SUBTOTAL = /coffee subtotal/i;
const CHECKOUT_LINK = /checkout/i;
const CHECKOUT_HEADING = /^checkout$/i;
const REVIEW_YOUR_CART = /review your cart/i;
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
const PAYMENT_STEP = /^payment$/i;
const STOREFRONT_URL_PATTERN = /e2e-test-org/;
const TRAILING_SLASH = /\/$/;
const BACK_TO_SHIPPING = /back to shipping/i;

const ADD_TO_CART = /add to cart/i;

async function openStorefront(page: import("@playwright/test").Page) {
  await page.goto(storefrontUrl(), { waitUntil: "networkidle" });
  await expect(page).toHaveURL(STOREFRONT_URL_PATTERN);
  await expect(
    page.getByRole("heading", { name: MORNING_SUNRISE_BLEND }).first()
  ).toBeVisible({ timeout: 15_000 });
}

async function openStorefrontWithCartItem(page: import("@playwright/test").Page) {
  await openStorefront(page);
  await page.getByRole("button", { name: ADD_TO_CART }).first().click();
  await expect(page.getByRole("button", { name: SHOPPING_CART })).toHaveAttribute(
    "aria-label",
    CART_WITH_ITEMS
  );
}

test("preview storefront renders seeded org and products", async ({ page }) => {
  await openStorefront(page);

  await expect(page.getByText(E2E_TEST_ORGANIZATION).first()).toBeVisible();
  await expect(page.getByRole("button", { name: ADD_TO_CART }).first()).toBeVisible();
});

test("preview storefront cart estimate opens from cloud browser", async ({
  page,
}) => {
  await openStorefrontWithCartItem(page);
  await page.getByRole("button", { name: SHOPPING_CART }).click();

  await expect(page.getByText(E2E_TEST_ORGANIZATION).first()).toBeVisible();
  await expect(page.getByText(MORNING_SUNRISE_BLEND).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: YOUR_CART })).toBeVisible();
  await expect(page.getByText(COFFEE_SUBTOTAL).first()).toBeVisible();
  await expect(page.getByRole("link", { name: CHECKOUT_LINK })).toBeVisible();
});

test("preview buyer reaches checkout payment step in cloud browser", async ({
  page,
}) => {
  await openStorefrontWithCartItem(page);
  await page.getByRole("button", { name: SHOPPING_CART }).click();
  await page.getByRole("link", { name: CHECKOUT_LINK }).click();
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("heading", { name: CHECKOUT_HEADING })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: REVIEW_YOUR_CART })
  ).toBeVisible();

  await page.getByRole("button", { name: CONTINUE_TO_SHIPPING }).click();

  await expect(
    page.getByRole("heading", { name: SHIPPING_AND_CONTACT })
  ).toBeVisible();

  await page.getByLabel(FULL_NAME).fill("Browserbase Buyer");
  await page.getByLabel(EMAIL).fill("browserbase-buyer@joeperks.test");
  await page.getByLabel(STREET_ADDRESS).fill("123 Brew St");
  await page.getByLabel(APT_SUITE_ETC).fill("Suite 4");
  await page.getByLabel(CITY).fill("Austin");
  await page.getByLabel(STATE).fill("TX");
  await page.getByLabel(ZIP_POSTAL_CODE).fill("78701");

  await page.getByRole("button", { name: CONTINUE_TO_PAYMENT }).click();

  await expect(page.getByText(PAYMENT_STEP).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: BACK_TO_SHIPPING })).toBeVisible();
});
