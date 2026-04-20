/**
 * Split math for Joe Perks orders. Canonical rules: `docs/AGENTS.md`,
 * formulas: `docs/07-stripe-payment-flow.mermaid` (Split calculation reference).
 *
 * - Amounts are **integer cents** only.
 * - Org and platform shares apply to **product subtotal** only (shipping excluded).
 * - Stripe processing fee is **2.9% + $0.30** of **gross** (product + shipping), per payment-flow doc.
 */

/** Stripe card-present / standard online: 2.9% + $0.30 — use integer math on gross cents. */
export const STRIPE_FEE_PERCENT_NUMERATOR = 29;
export const STRIPE_FEE_PERCENT_DENOMINATOR = 1000;
export const STRIPE_FEE_FIXED_CENTS = 30;

export const DEFAULT_PLATFORM_FEE_PCT = 0.05;
export const DEFAULT_PLATFORM_FEE_FLOOR_CENTS = 100;
export const DEFAULT_ORG_PCT_MIN = 0.05;
export const DEFAULT_ORG_PCT_MAX = 0.25;

export interface CalculateSplitsInput {
  /** Campaign/org share, e.g. `0.15` for 15%. Must be within org bounds. */
  orgPct: number;
  orgPctMax?: number;
  orgPctMin?: number;
  /** From `PlatformSettings.platformFeeFloor` (default $1.00). */
  platformFeeFloorCents?: number;
  /** From `PlatformSettings.platformFeePct` (default 5%). */
  platformFeePct?: number;
  /** Sum of line items (retail), cents — excludes shipping. */
  productSubtotalCents: number;
  /** Passthrough shipping, cents — not included in org/platform base. */
  shippingAmountCents: number;
}

export interface CalculateSplitsResult {
  grossAmount: number;
  orgAmount: number;
  orgPctSnapshot: number;
  platformAmount: number;
  productSubtotal: number;
  roasterAmount: number;
  /** Roaster product share plus shipping passthrough. */
  roasterTotal: number;
  shippingAmount: number;
  stripeFee: number;
}

function assertNonNegativeInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer (cents)`);
  }
}

/**
 * Stripe fee on the charge gross (product subtotal + shipping), 2.9% + 30¢, rounded to cents.
 */
export function calculateStripeFeeCents(grossAmountCents: number): number {
  assertNonNegativeInteger("grossAmountCents", grossAmountCents);
  const percentPart = Math.round(
    (grossAmountCents * STRIPE_FEE_PERCENT_NUMERATOR) /
      STRIPE_FEE_PERCENT_DENOMINATOR
  );
  return percentPart + STRIPE_FEE_FIXED_CENTS;
}

/**
 * Computes frozen split amounts for an order / PaymentIntent.
 * Validates org % bounds; throws if inputs are invalid or roaster share would be negative.
 */
export function calculateSplits(
  input: CalculateSplitsInput
): CalculateSplitsResult {
  const {
    productSubtotalCents,
    shippingAmountCents,
    orgPct,
    platformFeePct = DEFAULT_PLATFORM_FEE_PCT,
    platformFeeFloorCents = DEFAULT_PLATFORM_FEE_FLOOR_CENTS,
    orgPctMin = DEFAULT_ORG_PCT_MIN,
    orgPctMax = DEFAULT_ORG_PCT_MAX,
  } = input;

  assertNonNegativeInteger("productSubtotalCents", productSubtotalCents);
  assertNonNegativeInteger("shippingAmountCents", shippingAmountCents);

  if (orgPct < orgPctMin || orgPct > orgPctMax) {
    throw new RangeError(
      `orgPct must be between ${orgPctMin} and ${orgPctMax} (got ${orgPct})`
    );
  }
  if (platformFeePct < 0 || platformFeePct > 1) {
    throw new RangeError("platformFeePct must be between 0 and 1");
  }
  if (platformFeeFloorCents < 0 || !Number.isInteger(platformFeeFloorCents)) {
    throw new RangeError(
      "platformFeeFloorCents must be a non-negative integer"
    );
  }

  const grossAmount = productSubtotalCents + shippingAmountCents;
  const stripeFee = calculateStripeFeeCents(grossAmount);

  const orgAmount = Math.round(productSubtotalCents * orgPct);
  const platformAmount = Math.max(
    Math.round(productSubtotalCents * platformFeePct),
    platformFeeFloorCents
  );

  const roasterAmount =
    productSubtotalCents - orgAmount - platformAmount - stripeFee;

  if (roasterAmount < 0) {
    throw new RangeError(
      "Split yields negative roaster amount: increase product subtotal, lower org/platform fee, or adjust campaign settings"
    );
  }

  const roasterTotal = roasterAmount + shippingAmountCents;

  return {
    productSubtotal: productSubtotalCents,
    shippingAmount: shippingAmountCents,
    grossAmount,
    stripeFee,
    orgPctSnapshot: orgPct,
    orgAmount,
    platformAmount,
    roasterAmount,
    roasterTotal,
  };
}
