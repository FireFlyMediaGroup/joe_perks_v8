import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";

const MORNING_SUNRISE_BLEND = /morning sunrise blend/i;
const SHOPPING_CART = /shopping cart/i;
const CART_WITH_ONE_ITEM = /shopping cart, 1 items/i;
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
const SECURING_YOUR_ORDER = /securing your order/i;
const PAY_BUTTON = /^pay \$/i;

const fixtures = JSON.parse(
  readFileSync(
    resolve(
      dirname(fileURLToPath(import.meta.url)),
      ".generated/fixtures.json"
    ),
    "utf8"
  )
) as {
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
};

const STOREFRONT_SLUG = `/${fixtures.slug}`;

function cartStorageValue() {
  return JSON.stringify({
    state: fixtures.cartState,
    version: 0,
  });
}

async function seedCartState(page: Page) {
  await page.evaluate(
    ({ cartState, storageValue }) => {
      window.__JOE_PERKS_CART_STORE__?.setState(cartState);
      window.localStorage.setItem("joe-perks-cart", storageValue);
    },
    {
      cartState: fixtures.cartState,
      storageValue: cartStorageValue(),
    }
  );
}

async function openStorefrontWithSeededCart(page: Page) {
  await page.goto(STOREFRONT_SLUG);
  await page.waitForLoadState("networkidle");
  await seedCartState(page);

  await expect(
    page.getByRole("heading", { name: MORNING_SUNRISE_BLEND }).first()
  ).toBeVisible();
  const cartButton = page.getByRole("button", { name: SHOPPING_CART });
  await expect(cartButton).toHaveAttribute("aria-label", CART_WITH_ONE_ITEM);
}

test("storefront renders seeded products and cart estimate", async ({
  page,
}) => {
  await openStorefrontWithSeededCart(page);
  await page.getByRole("button", { name: SHOPPING_CART }).click();

  await expect(page.getByText(E2E_TEST_ORGANIZATION).first()).toBeVisible();
  await expect(page.getByText(MORNING_SUNRISE_BLEND).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: YOUR_CART })).toBeVisible();
  await expect(page.getByText(COFFEE_SUBTOTAL).first()).toBeVisible();
  await expect(page.getByRole("link", { name: CHECKOUT_LINK })).toBeVisible();
});

test("buyer can reach payment step from storefront checkout", async ({
  page,
}) => {
  await openStorefrontWithSeededCart(page);
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

  await page.getByLabel(FULL_NAME).fill("Playwright Buyer");
  await page.getByLabel(EMAIL).fill("playwright-buyer@joeperks.test");
  await page.getByLabel(STREET_ADDRESS).fill("123 Brew St");
  await page.getByLabel(APT_SUITE_ETC).fill("Suite 4");
  await page.getByLabel(CITY).fill("Austin");
  await page.getByLabel(STATE).fill("TX");
  await page.getByLabel(ZIP_POSTAL_CODE).fill("78701");

  await page.getByRole("button", { name: CONTINUE_TO_PAYMENT }).click();

  await expect(page.getByText(SECURING_YOUR_ORDER)).toBeVisible();
  await expect(page.locator("iframe").first()).toBeVisible();
  await expect(page.getByRole("button", { name: PAY_BUTTON })).toBeVisible();
});
