import { describe, expect, it } from "vitest";

import {
  mapRecipientAccountStatusToOnboardingStatus,
  mapStripeAccountToOnboardingStatus,
} from "./stripe-account-status";

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

describe("mapRecipientAccountStatusToOnboardingStatus", () => {
  it("returns COMPLETE when recipient transfers are active and requirements are not due", () => {
    const status = {
      account: {} as never,
      onboardingComplete: true,
      readyToReceivePayments: true,
      requirementsStatus: "eventually_due",
      transferStatus: "active",
    } as const;

    expect(mapRecipientAccountStatusToOnboardingStatus(status)).toBe(
      "COMPLETE"
    );
  });

  it("returns NOT_STARTED while current requirements are due", () => {
    const status = {
      account: {} as never,
      onboardingComplete: false,
      readyToReceivePayments: false,
      requirementsStatus: "currently_due",
      transferStatus: "pending",
    } as const;

    expect(mapRecipientAccountStatusToOnboardingStatus(status)).toBe(
      "NOT_STARTED"
    );
  });

  it("returns RESTRICTED for restricted recipient transfer capability", () => {
    const status = {
      account: {} as never,
      onboardingComplete: true,
      readyToReceivePayments: false,
      requirementsStatus: null,
      transferStatus: "restricted",
    } as const;

    expect(mapRecipientAccountStatusToOnboardingStatus(status)).toBe(
      "RESTRICTED"
    );
  });
});
