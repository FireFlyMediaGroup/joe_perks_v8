import { expect, type Page } from "@playwright/test";

export interface SmokeCardDetails {
  cvc: string;
  exp: string;
  number: string;
  zip?: string;
}

const STRIPE_PAYMENT_FRAME =
  'iframe[title="Secure payment input frame"]';
const CARD_NUMBER = /1234|Card number/i;
const CARD_EXP = /MM \/ YY|Expiration/i;
const CARD_CVC = /CVC|Security code/i;
const CARD_ZIP = /ZIP|Postal code/i;

export function resolveSmokeCardDetails(): SmokeCardDetails {
  const number = process.env.LIVE_SMOKE_CARD_NUMBER;
  const exp = process.env.LIVE_SMOKE_CARD_EXP;
  const cvc = process.env.LIVE_SMOKE_CARD_CVC;

  if (number && exp && cvc) {
    return {
      cvc,
      exp,
      number: number.replace(/\s/g, ""),
      zip: process.env.LIVE_SMOKE_CARD_ZIP ?? "78701",
    };
  }

  if (process.env.LIVE_SMOKE_ALLOW_TEST_CARD === "1") {
    return {
      cvc: "123",
      exp: "12/34",
      number: "4242424242424242",
      zip: "78701",
    };
  }

  throw new Error(
    "Set LIVE_SMOKE_CARD_NUMBER, LIVE_SMOKE_CARD_EXP, and LIVE_SMOKE_CARD_CVC for live checkout. " +
      "For Stripe test-mode previews only, set LIVE_SMOKE_ALLOW_TEST_CARD=1."
  );
}

/** Stripe Payment Element may show Card / Bank / … tabs before card fields mount. */
async function selectStripeCardTab(page: Page): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const cardTab = frame.getByRole("button", { name: /^Card$/i });
      if ((await cardTab.count()) > 0) {
        await cardTab.first().click();
        return;
      }
    }
    await page.waitForTimeout(500);
  }
}

export async function fillStripePaymentElement(
  page: Page,
  card: SmokeCardDetails
): Promise<void> {
  await selectStripeCardTab(page);

  const frame = page.frameLocator(STRIPE_PAYMENT_FRAME).first();
  await expect(frame.getByRole("textbox", { name: CARD_NUMBER })).toBeVisible({
    timeout: 30_000,
  });

  await frame.getByRole("textbox", { name: CARD_NUMBER }).fill(card.number);
  await frame.getByRole("textbox", { name: CARD_EXP }).fill(card.exp);
  await frame.getByRole("textbox", { name: CARD_CVC }).fill(card.cvc);

  if (card.zip) {
    const zipField = frame.getByRole("textbox", { name: CARD_ZIP });
    if (await zipField.count()) {
      await zipField.fill(card.zip);
    }
  }
}
