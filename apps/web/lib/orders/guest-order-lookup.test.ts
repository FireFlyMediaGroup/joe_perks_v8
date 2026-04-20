import { expect, test } from "vitest";
import {
  hydrateGuestOrderLookupOrder,
  normalizeGuestOrderLookupEmail,
  normalizeGuestOrderLookupOrderNumber,
  serializeGuestOrderLookupOrder,
} from "./guest-order-lookup";

test("US-09-06: normalizes guest lookup inputs before matching", () => {
  expect(normalizeGuestOrderLookupEmail("  Buyer@Example.com  ")).toBe(
    "buyer@example.com"
  );
  expect(normalizeGuestOrderLookupOrderNumber("  jp-00042  ")).toBe("JP-00042");
});

test("US-09-06: serializes and hydrates guest lookup order dates", () => {
  const serialized = serializeGuestOrderLookupOrder({
    buyerEmail: "buyer@example.com",
    carrier: "UPS",
    deliveredAt: null,
    fulfillBy: new Date("2026-04-08T12:00:00.000Z"),
    fundraiserName: "Lincoln PTA",
    grossAmount: 3895,
    id: "ord_123",
    items: [],
    orderNumber: "JP-00042",
    orgAmount: 525,
    orgPctSnapshot: 15,
    placedAt: new Date("2026-04-05T12:00:00.000Z"),
    productSubtotal: 3295,
    shipToAddress1: "123 Roast St",
    shipToAddress2: null,
    shipToCity: "Nashville",
    shipToCountry: "US",
    shipToName: "Pat Buyer",
    shipToPostalCode: "37203",
    shipToState: "TN",
    shippedAt: new Date("2026-04-06T09:00:00.000Z"),
    shippingAmount: 600,
    status: "SHIPPED",
    trackingNumber: "1Z999AA10123456784",
  });

  expect(hydrateGuestOrderLookupOrder(serialized)).toMatchObject({
    buyerEmail: "buyer@example.com",
    fulfillBy: new Date("2026-04-08T12:00:00.000Z"),
    orderNumber: "JP-00042",
    placedAt: new Date("2026-04-05T12:00:00.000Z"),
    shippedAt: new Date("2026-04-06T09:00:00.000Z"),
  });
});
