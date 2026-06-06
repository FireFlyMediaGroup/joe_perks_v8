import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";

/**
 * Shared storefront → checkout navigation used by the money-path e2e specs.
 * Mirrors the proven flow in storefront.spec.ts; kept here so multiple specs can
 * reuse it without duplicating the (selector-sensitive) step sequence.
 */

const MORNING_SUNRISE_BLEND = /morning sunrise blend/i;
const SHOPPING_CART = /shopping cart/i;
const CART_WITH_ONE_ITEM = /shopping cart, 1 items/i;
const CHECKOUT_LINK = /checkout/i;
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
const CREATE_INTENT_PATH = "/api/checkout/create-intent";

interface Fixtures {
  cartState: {
    activeCampaignId: string;
    activeOrgSlug: string;
    lines: Array<{
      campaignItemId: string;
      imageUrl?: string;
      productName: string;
      quantity: number;
      retailPrice: number;
      variantDesc: string;
    }>;
  };
  slug: string;
}

export interface CreateIntentResult {
  grossAmount: number;
  orderId: string;
  orderNumber: string;
  paymentIntentId: string;
}

const fixtures = JSON.parse(
  readFileSync(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../.generated/fixtures.json"
    ),
    "utf8"
  )
) as Fixtures;

export const storefrontSlug = `/${fixtures.slug}`;

async function seedCartState(page: Page): Promise<void> {
  await page.evaluate(
    ({ cartState, storageValue }) => {
      window.__JOE_PERKS_CART_STORE__?.setState(cartState);
      window.localStorage.setItem("joe-perks-cart", storageValue);
    },
    {
      cartState: fixtures.cartState,
      storageValue: JSON.stringify({ state: fixtures.cartState, version: 0 }),
    }
  );
}

export async function openStorefrontWithSeededCart(page: Page): Promise<void> {
  await page.goto(storefrontSlug);
  await page.waitForLoadState("networkidle");
  await seedCartState(page);

  await expect(
    page.getByRole("heading", { name: MORNING_SUNRISE_BLEND }).first()
  ).toBeVisible();
  const cartButton = page.getByRole("button", { name: SHOPPING_CART });
  await expect(cartButton).toHaveAttribute("aria-label", CART_WITH_ONE_ITEM);
}

/**
 * Drives the checkout to the payment step and returns the `create-intent`
 * response (which creates the PENDING order + PaymentIntent). Settlement is then
 * driven by a signed webhook — see `_helpers/stripe-webhook.ts`.
 */
export async function checkoutToPaymentStep(
  page: Page
): Promise<CreateIntentResult> {
  await openStorefrontWithSeededCart(page);
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
  await page.getByLabel(FULL_NAME).fill("Playwright Buyer");
  await page.getByLabel(EMAIL).fill("playwright-buyer@joeperks.test");
  await page.getByLabel(STREET_ADDRESS).fill("123 Brew St");
  await page.getByLabel(APT_SUITE_ETC).fill("Suite 4");
  await page.getByLabel(CITY).fill("Austin");
  await page.getByLabel(STATE).fill("TX");
  await page.getByLabel(ZIP_POSTAL_CODE).fill("78701");

  // Capture the create-intent response that fires when entering the payment step.
  const createIntentResponse = page.waitForResponse(
    (r) =>
      r.url().includes(CREATE_INTENT_PATH) && r.request().method() === "POST"
  );
  await page.getByRole("button", { name: CONTINUE_TO_PAYMENT }).click();
  const response = await createIntentResponse;

  expect(response.ok()).toBe(true);
  return (await response.json()) as CreateIntentResult;
}
