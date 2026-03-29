import { describe, expect, it } from "vitest";

import {
  calculateSplits,
  calculateStripeFeeCents,
  DEFAULT_PLATFORM_FEE_FLOOR_CENTS,
} from "./splits";

describe("calculateStripeFeeCents", () => {
  it("uses 2.9% + 30¢ on gross cents", () => {
    expect(calculateStripeFeeCents(11_000)).toBe(
      Math.round((11_000 * 29) / 1000) + 30
    );
  });
});

describe("calculateSplits", () => {
  it("excludes shipping from org and platform base but includes it in gross and stripe fee", () => {
    const productSubtotalCents = 10_000;
    const shippingAmountCents = 1000;
    const gross = productSubtotalCents + shippingAmountCents;
    const stripeFee = calculateStripeFeeCents(gross);

    const result = calculateSplits({
      productSubtotalCents,
      shippingAmountCents,
      orgPct: 0.15,
    });

    expect(result.grossAmount).toBe(gross);
    expect(result.stripeFee).toBe(stripeFee);
    expect(result.orgAmount).toBe(1500);
    expect(result.platformAmount).toBe(500);
    expect(result.roasterAmount).toBe(
      productSubtotalCents - 1500 - 500 - stripeFee
    );
    expect(result.roasterTotal).toBe(
      result.roasterAmount + shippingAmountCents
    );
    expect(
      result.orgAmount +
        result.platformAmount +
        result.roasterAmount +
        result.stripeFee
    ).toBe(productSubtotalCents);
  });

  it("applies platform fee floor when 5% is below $1", () => {
    const result = calculateSplits({
      productSubtotalCents: 1000,
      shippingAmountCents: 0,
      orgPct: 0.05,
      platformFeePct: 0.05,
      platformFeeFloorCents: DEFAULT_PLATFORM_FEE_FLOOR_CENTS,
    });
    expect(result.platformAmount).toBe(100);
    expect(result.orgAmount).toBe(50);
  });

  it("rejects org pct outside bounds", () => {
    expect(() =>
      calculateSplits({
        productSubtotalCents: 5000,
        shippingAmountCents: 0,
        orgPct: 0.04,
      })
    ).toThrow(RangeError);
  });

  it("throws when roaster share would be negative", () => {
    expect(() =>
      calculateSplits({
        productSubtotalCents: 100,
        shippingAmountCents: 0,
        orgPct: 0.25,
        platformFeePct: 0.05,
        platformFeeFloorCents: 100,
      })
    ).toThrow(RangeError);
  });
});
