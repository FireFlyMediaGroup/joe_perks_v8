import { expect, test } from "vitest";
import { buildShippingPrefillFromOrderSnapshot } from "./buyer-prefill";

test("US-09-02: builds editable checkout prefill from latest order snapshot", () => {
  expect(
    buildShippingPrefillFromOrderSnapshot({
      defaultShippingRateId: "rate_standard",
      order: {
        buyerEmail: "buyer@example.com",
        shipToAddress1: "123 Roast St",
        shipToAddress2: "Apt 4B",
        shipToCity: "Nashville",
        shipToCountry: "US",
        shipToName: "Pat Buyer",
        shipToPostalCode: "37203",
        shipToState: "TN",
      },
    })
  ).toEqual({
    buyerEmail: "buyer@example.com",
    buyerName: "Pat Buyer",
    city: "Nashville",
    country: "US",
    shippingRateId: "rate_standard",
    state: "TN",
    street: "123 Roast St",
    street2: "Apt 4B",
    zip: "37203",
  });
});

test("US-09-02: skips checkout prefill when no default shipping rate exists", () => {
  expect(
    buildShippingPrefillFromOrderSnapshot({
      defaultShippingRateId: null,
      order: {
        buyerEmail: "buyer@example.com",
        shipToAddress1: "123 Roast St",
        shipToAddress2: null,
        shipToCity: "Nashville",
        shipToCountry: "US",
        shipToName: "Pat Buyer",
        shipToPostalCode: "37203",
        shipToState: "TN",
      },
    })
  ).toBeNull();
});
