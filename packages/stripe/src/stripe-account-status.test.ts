import { describe, expect, it } from "vitest";

import { mapStripeAccountToOnboardingStatus } from "./stripe-account-status";

describe("mapStripeAccountToOnboardingStatus", () => {
  it("returns RESTRICTED when disabled_reason is set", () => {
    const account = {
      requirements: { disabled_reason: "rejected.fraud" },
    } as Parameters<typeof mapStripeAccountToOnboardingStatus>[0];
    expect(mapStripeAccountToOnboardingStatus(account)).toBe("RESTRICTED");
  });

  it("returns COMPLETE when charges, payouts, and details are complete", () => {
    const account = {
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
    } as Parameters<typeof mapStripeAccountToOnboardingStatus>[0];
    expect(mapStripeAccountToOnboardingStatus(account)).toBe("COMPLETE");
  });

  it("returns NOT_STARTED when details are not submitted", () => {
    const account = {
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    } as Parameters<typeof mapStripeAccountToOnboardingStatus>[0];
    expect(mapStripeAccountToOnboardingStatus(account)).toBe("NOT_STARTED");
  });

  it("returns PENDING when details submitted but payouts not yet enabled", () => {
    const account = {
      charges_enabled: true,
      payouts_enabled: false,
      details_submitted: true,
    } as Parameters<typeof mapStripeAccountToOnboardingStatus>[0];
    expect(mapStripeAccountToOnboardingStatus(account)).toBe("PENDING");
  });
});
