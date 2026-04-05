import { expect, test } from "vitest";

import {
  buildOrderSnapshotData,
  checkoutSchema,
} from "./checkout-payload";

test("US-09-00: checkout payload parses snapshot fields with US default country", () => {
  const parsed = checkoutSchema.parse({
    buyerEmail: "buyer@example.com",
    buyerName: "Pat Buyer",
    campaignId: "camp_123",
    city: "Nashville",
    items: [{ campaignItemId: "item_123", quantity: 2 }],
    shippingRateId: "rate_123",
    state: "TN",
    street: "123 Roast St",
    zip: "37203",
  });

  expect(parsed.country).toBe("US");
  expect(parsed.street2).toBeUndefined();
});

test("US-09-00: order snapshot helper trims optional address line two", () => {
  const parsed = checkoutSchema.parse({
    buyerEmail: "buyer@example.com",
    buyerName: "Pat Buyer",
    campaignId: "camp_123",
    city: "Nashville",
    country: "us",
    items: [{ campaignItemId: "item_123", quantity: 2 }],
    shippingRateId: "rate_123",
    state: "TN",
    street: "123 Roast St",
    street2: "  Apt 4B  ",
    zip: "37203",
  });

  expect(buildOrderSnapshotData(parsed)).toEqual({
    buyerEmail: "buyer@example.com",
    shipToAddress1: "123 Roast St",
    shipToAddress2: "Apt 4B",
    shipToCity: "Nashville",
    shipToCountry: "US",
    shipToName: "Pat Buyer",
    shipToPostalCode: "37203",
    shipToState: "TN",
  });
});
