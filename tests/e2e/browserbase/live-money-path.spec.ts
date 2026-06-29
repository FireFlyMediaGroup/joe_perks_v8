import { completeFulfillmentViaMagicLink } from "./_helpers/fulfillment-flow";
import {
  redactFulfillUrl,
  writeLiveSmokeEvidence,
} from "./_helpers/live-smoke-evidence";
import { refundPaymentIntent } from "./_helpers/live-stripe-refund";
import {
  completeCheckoutThroughPaymentStep,
  openStorefrontWithCart,
  PAY_BUTTON_PATTERN,
  PAYMENT_INTENT_IN_URL,
  requireBaseUrl,
} from "./_helpers/prod-checkout-flow";
import { waitForFulfillmentLink } from "./_helpers/resolve-fulfillment-link";
import {
  fillStripePaymentElement,
  resolveSmokeCardDetails,
} from "./_helpers/stripe-payment-element";
import { expect, getBrowserbaseSessionUrl, test } from "./fixtures";
import {
  assertLiveSmokePreflight,
  resolveSmokeLaneOrgSlug,
} from "./_helpers/smoke-lane-preflight";

const ORG_SLUG = resolveSmokeLaneOrgSlug();
const BUYER_NAME = process.env.LIVE_SMOKE_BUYER_NAME ?? "Live Smoke Buyer";
const BUYER_EMAIL =
  process.env.LIVE_SMOKE_BUYER_EMAIL ?? "joe@joeperks.com";
const SETTLE_TIMEOUT_MS = Number(process.env.LIVE_SMOKE_SETTLE_TIMEOUT_MS ?? "120000");
const PAYMENT_INTENT_ID = /^pi_/;

interface OrderStatusPayload {
  grossAmount: number;
  id: string;
  orderNumber: string;
  status: string;
}

async function fetchOrderStatus(
  paymentIntentId: string
): Promise<OrderStatusPayload | null> {
  const res = await fetch(
    `${requireBaseUrl()}/api/order-status?pi=${encodeURIComponent(paymentIntentId)}`
  );
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as OrderStatusPayload;
}

async function pollOrderStatus(
  paymentIntentId: string,
  expectedStatus: string
): Promise<OrderStatusPayload> {
  const started = Date.now();
  while (Date.now() - started < SETTLE_TIMEOUT_MS) {
    const body = await fetchOrderStatus(paymentIntentId);
    if (body?.status === expectedStatus) {
      return body;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  const latest = await fetchOrderStatus(paymentIntentId);
  throw new Error(
    `Order ${paymentIntentId} did not reach ${expectedStatus} within ${SETTLE_TIMEOUT_MS}ms` +
      (latest ? ` (last status: ${latest.status})` : "")
  );
}

function paymentIntentIdFromUrl(url: string): string {
  const match = url.match(PAYMENT_INTENT_IN_URL);
  if (!match?.[1]) {
    throw new Error(`Could not parse payment intent id from URL: ${url}`);
  }
  return match[1];
}

test.beforeAll(() => {
  assertLiveSmokePreflight();
});

/**
 * P-13 / P-14 / P-15: checkout → CONFIRMED → roaster magic link → SHIPPED → optional refund.
 *
 * Recording: Browserbase session replay + test-results/live-money-path-evidence.json
 */
test("live money path: checkout, fulfillment magic link, ship, optional refund", async ({
  page,
}, testInfo) => {
  const card = resolveSmokeCardDetails();
  const baseURL = requireBaseUrl();
  const autoRefund = process.env.LIVE_SMOKE_AUTO_REFUND !== "0";
  const roasterAppOrigin =
    process.env.ROASTER_APP_ORIGIN ?? "https://roasters.joeperks.com";

  await openStorefrontWithCart(page, ORG_SLUG);
  await completeCheckoutThroughPaymentStep(page, {
    email: BUYER_EMAIL,
    name: BUYER_NAME,
  });

  await fillStripePaymentElement(page, card);
  await page.getByRole("button", { name: PAY_BUTTON_PATTERN }).click();

  await page.waitForURL(PAYMENT_INTENT_IN_URL, { timeout: 120_000 });
  const paymentIntentId = paymentIntentIdFromUrl(page.url());
  expect(paymentIntentId).toMatch(PAYMENT_INTENT_ID);

  const confirmed = await pollOrderStatus(paymentIntentId, "CONFIRMED");
  expect(confirmed.orderNumber).toBeTruthy();

  await expect(
    page.getByText(new RegExp(`thank you!|${confirmed.orderNumber}`, "i"))
  ).toBeVisible({ timeout: 15_000 });

  const fulfillmentLink = await waitForFulfillmentLink(confirmed.id);
  expect(fulfillmentLink.emailLog).toBeTruthy();
  expect(fulfillmentLink.fulfillUrl).toContain("/fulfill/");

  console.log(`Fulfillment magic link ready: ${redactFulfillUrl(fulfillmentLink.fulfillUrl)}`);

  const tracking = await completeFulfillmentViaMagicLink(
    page,
    fulfillmentLink.fulfillUrl,
    confirmed.orderNumber
  );

  const shipped = await pollOrderStatus(paymentIntentId, "SHIPPED");
  expect(shipped.orderNumber).toBe(confirmed.orderNumber);

  let refund:
    | { chargeId: string; refundId: string; status: string }
    | undefined;
  let finalStatus = shipped.status;

  if (autoRefund) {
    refund = await refundPaymentIntent(paymentIntentId);
    const refunded = await pollOrderStatus(paymentIntentId, "REFUNDED");
    finalStatus = refunded.status;
  }

  const evidencePath = writeLiveSmokeEvidence({
    autoRefunded: autoRefund,
    baseURL,
    browserbaseSessionUrl: getBrowserbaseSessionUrl(),
    chargeId: refund?.chargeId,
    completedAt: new Date().toISOString(),
    fulfillmentCarrier: tracking.carrier,
    fulfillmentEmailLogId: fulfillmentLink.emailLog?.id,
    fulfillmentEmailSentTo: fulfillmentLink.emailLog?.to,
    fulfillmentMagicLinkId: fulfillmentLink.magicLinkId,
    fulfillmentSubmitted: true,
    fulfillmentTrackingNumber: tracking.trackingNumber,
    fulfillUrlRedacted: redactFulfillUrl(fulfillmentLink.fulfillUrl),
    grossAmount: confirmed.grossAmount,
    orderId: confirmed.id,
    orderNumber: confirmed.orderNumber,
    orderStatus: finalStatus,
    orgSlug: ORG_SLUG,
    paymentIntentId,
    refundId: refund?.refundId,
    refundStatus: refund?.status,
    roasterAppOrigin,
    testName: testInfo.title,
  });

  await testInfo.attach("live-money-path-evidence.json", {
    contentType: "application/json",
    path: evidencePath,
  });
});
