import { describe, expect, it } from "vitest";

import {
  assertSplitInvariants,
  type CalculateSplitsInput,
  type CalculateSplitsResult,
  calculateSplits,
  calculateStripeFeeCents,
  DEFAULT_PLATFORM_FEE_FLOOR_CENTS,
  SplitInvariantError,
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

describe("assertSplitInvariants", () => {
  const validInput: CalculateSplitsInput = {
    productSubtotalCents: 10_000,
    shippingAmountCents: 1000,
    orgPct: 0.15,
  };

  // Build a real, internally-consistent result, then mutate single fields to
  // simulate the regressions each invariant is meant to catch.
  function makeResult(
    overrides: Partial<CalculateSplitsResult> = {}
  ): CalculateSplitsResult {
    return { ...calculateSplits(validInput), ...overrides };
  }

  it("passes for a freshly computed split", () => {
    expect(() =>
      assertSplitInvariants(calculateSplits(validInput), validInput)
    ).not.toThrow();
  });

  it("passes at the platform floor with a zero-shipping order", () => {
    const input: CalculateSplitsInput = {
      productSubtotalCents: 1000,
      shippingAmountCents: 0,
      orgPct: 0.05,
    };
    expect(() =>
      assertSplitInvariants(calculateSplits(input), input)
    ).not.toThrow();
  });

  it("1. flags a split that does not sum to the product subtotal", () => {
    let caught: unknown;
    try {
      assertSplitInvariants(makeResult({ roasterAmount: 0 }), validInput);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SplitInvariantError);
    expect((caught as SplitInvariantError).invariant).toBe("split-integrity");
  });

  it("2. flags gross != productSubtotal + shipping", () => {
    expect(() =>
      assertSplitInvariants(makeResult({ grossAmount: 99_999 }), validInput)
    ).toThrow("gross-integrity");
  });

  it("3. flags a negative amount", () => {
    expect(() =>
      assertSplitInvariants(makeResult({ stripeFee: -1 }), validInput)
    ).toThrow("non-negativity");
  });

  it("3. flags a non-integer amount", () => {
    expect(() =>
      assertSplitInvariants(makeResult({ orgAmount: 100.5 }), validInput)
    ).toThrow("non-negativity");
  });

  it("4. flags a broken shipping passthrough", () => {
    expect(() =>
      assertSplitInvariants(makeResult({ roasterTotal: 0 }), validInput)
    ).toThrow("shipping-passthrough");
  });

  it("5. flags a platform amount below the floor", () => {
    // Keep invariants 1–4 intact: move the missing platform cents into roaster
    // (and keep roasterTotal = roasterAmount + shipping) so only the floor trips.
    const base = calculateSplits(validInput);
    const movedToRoaster = base.roasterAmount + base.platformAmount - 1;
    const broken = makeResult({
      platformAmount: 1,
      roasterAmount: movedToRoaster,
      roasterTotal: movedToRoaster + base.shippingAmount,
    });
    expect(() => assertSplitInvariants(broken, validInput)).toThrow(
      "platform-floor"
    );
  });

  it("6. flags an org pct outside the configured bounds", () => {
    expect(() =>
      assertSplitInvariants(makeResult({ orgPctSnapshot: 0.99 }), validInput)
    ).toThrow("org-bounds");
  });
});
