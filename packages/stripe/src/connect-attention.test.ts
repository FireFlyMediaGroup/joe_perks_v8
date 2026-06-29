import { describe, expect, it } from "vitest";

import type { RecipientAccountStatus } from "./connect";
import {
  extractPendingRequirementDescriptions,
  resolveConnectAttentionContext,
} from "./connect-attention";

function makeStatus(
  overrides: Partial<RecipientAccountStatus> = {}
): RecipientAccountStatus {
  return {
    account: {
      requirements: { entries: [] },
      future_requirements: { entries: [] },
    } as RecipientAccountStatus["account"],
    onboardingComplete: false,
    readyToReceivePayments: false,
    requirementsStatus: null,
    transferStatus: null,
    ...overrides,
  };
}

describe("extractPendingRequirementDescriptions", () => {
  it("deduplicates current and future requirement descriptions", () => {
    const descriptions = extractPendingRequirementDescriptions({
      requirements: {
        entries: [{ description: "Provide a date of birth" }],
      },
      future_requirements: {
        entries: [
          { description: "Provide a date of birth" },
          {
            description:
              "Provide the last four digits of your Social Security number",
          },
        ],
      },
    });

    expect(descriptions).toEqual([
      "Provide a date of birth",
      "Provide the last four digits of your Social Security number",
    ]);
  });
});

describe("resolveConnectAttentionContext", () => {
  it("returns verification pending messaging for connected soft-restricted accounts", () => {
    const context = resolveConnectAttentionContext(
      makeStatus({
        onboardingComplete: true,
        requirementsStatus: "eventually_due",
        transferStatus: "restricted",
        account: {
          requirements: { entries: [] },
          future_requirements: {
            entries: [
              { description: "Provide a date of birth" },
              {
                description:
                  "Provide the last four digits of your Social Security number",
              },
            ],
          },
        } as RecipientAccountStatus["account"],
      })
    );

    expect(context.tier).toBe("verification_pending");
    expect(context.variant).toBe("warning");
    expect(context.showStripeButton).toBe(true);
    expect(context.stripeButtonLabel).toBe("Update details in Stripe");
    expect(context.pendingItems).toHaveLength(2);
  });

  it("returns blocked messaging for past-due requirements", () => {
    const context = resolveConnectAttentionContext(
      makeStatus({
        requirementsStatus: "past_due",
        transferStatus: "restricted",
      }),
      { supportEntity: "organization" }
    );

    expect(context.tier).toBe("blocked");
    expect(context.variant).toBe("destructive");
    expect(context.showStripeButton).toBe(false);
    expect(context.body).toContain("organization");
  });
});
