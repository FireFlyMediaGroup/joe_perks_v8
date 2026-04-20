import { describe, expect, test } from "vitest";
import {
  getBuyerOrderTrackingStateCopy,
  getCarrierTrackingHref,
  isBuyerOrderDelayed,
} from "./order-detail";

describe("buyer order detail helpers", () => {
  test("builds direct tracking links for supported carriers", () => {
    expect(getCarrierTrackingHref("USPS", "9400111202555012345678")).toBe(
      "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111202555012345678"
    );
    expect(getCarrierTrackingHref("FedEx", "123456789012")).toBe(
      "https://www.fedex.com/fedextrack/?trknbr=123456789012"
    );
    expect(getCarrierTrackingHref("Local courier", "ABC123")).toBeNull();
  });

  test("marks confirmed overdue orders as delayed for buyers", () => {
    expect(
      isBuyerOrderDelayed(
        {
          fulfillBy: new Date("2026-04-03T12:00:00.000Z"),
          shippedAt: null,
          status: "CONFIRMED",
        },
        new Date("2026-04-04T12:00:00.000Z")
      )
    ).toBe(true);
  });

  test("returns delayed copy when the ship-by date has passed", () => {
    expect(
      getBuyerOrderTrackingStateCopy(
        {
          carrier: null,
          deliveredAt: null,
          fulfillBy: new Date("2026-04-03T12:00:00.000Z"),
          shippedAt: null,
          status: "CONFIRMED",
          trackingNumber: null,
        },
        new Date("2026-04-04T12:00:00.000Z")
      )
    ).toMatchObject({
      headline: "Your order is taking longer than expected to ship.",
      label: "Delayed",
    });
  });

  test("keeps shipped orders in the shipped state even with late delivery", () => {
    expect(
      getBuyerOrderTrackingStateCopy(
        {
          carrier: "UPS",
          deliveredAt: null,
          fulfillBy: new Date("2026-04-03T12:00:00.000Z"),
          shippedAt: new Date("2026-04-02T12:00:00.000Z"),
          status: "SHIPPED",
          trackingNumber: "1Z999AA10123456784",
        },
        new Date("2026-04-08T12:00:00.000Z")
      )
    ).toMatchObject({
      headline: "Your order is on the way.",
      label: "Shipped",
    });
  });
});
