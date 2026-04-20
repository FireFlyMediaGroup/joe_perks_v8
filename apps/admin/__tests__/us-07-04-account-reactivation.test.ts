import { expect, test } from "vitest";

import { getAccountReactivationReadiness } from "../app/_lib/account-reactivation";

test("US-07-04: reactivation returns ACTIVE when no blockers remain", () => {
  const readiness = getAccountReactivationReadiness({
    chargesEnabled: true,
    openDisputesCount: 0,
    openOrderCount: 0,
    payoutsEnabled: true,
    stripeOnboarding: "COMPLETE",
    unsettledDebtCount: 0,
  });

  expect(readiness.defaultCanReactivate).toBe(true);
  expect(readiness.requiresOverride).toBe(false);
  expect(readiness.nextStatus).toBe("ACTIVE");
});

test("US-07-04: blockers require override even when Stripe is ready", () => {
  const readiness = getAccountReactivationReadiness({
    chargesEnabled: true,
    openDisputesCount: 1,
    openOrderCount: 2,
    payoutsEnabled: true,
    stripeOnboarding: "COMPLETE",
    unsettledDebtCount: 1,
  });

  expect(readiness.defaultCanReactivate).toBe(false);
  expect(readiness.requiresOverride).toBe(true);
  expect(readiness.nextStatus).toBe("ACTIVE");
  expect(readiness.blockers).toEqual([
    "1 open dispute",
    "1 unsettled debt item",
    "2 open fulfillment obligations",
  ]);
});

test("US-07-04: missing Stripe readiness keeps reactivated account in ONBOARDING", () => {
  const readiness = getAccountReactivationReadiness({
    chargesEnabled: false,
    openDisputesCount: 0,
    openOrderCount: 0,
    payoutsEnabled: false,
    stripeOnboarding: "RESTRICTED",
    unsettledDebtCount: 0,
  });

  expect(readiness.defaultCanReactivate).toBe(false);
  expect(readiness.nextStatus).toBe("ONBOARDING");
  expect(readiness.stripeReady).toBe(false);
  expect(readiness.stripeRequirements).toEqual([
    "Stripe onboarding is not complete",
    "Stripe charges are not enabled",
    "Stripe payouts are not enabled",
  ]);
});
