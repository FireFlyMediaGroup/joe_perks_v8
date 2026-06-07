import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createRecipientAccountLink: vi.fn(),
  createRecipientConnectedAccount: vi.fn(),
  database: {
    roaster: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
  },
  mapRecipientAccountStatusToOnboardingStatus: vi.fn(),
  normalizeRecipientAccountStatus: vi.fn(),
}));

vi.mock("@joe-perks/db", () => ({ database: mocks.database }));
vi.mock("@joe-perks/stripe", () => ({
  createRecipientAccountLink: mocks.createRecipientAccountLink,
  createRecipientConnectedAccount: mocks.createRecipientConnectedAccount,
  mapRecipientAccountStatusToOnboardingStatus:
    mocks.mapRecipientAccountStatusToOnboardingStatus,
  normalizeRecipientAccountStatus: mocks.normalizeRecipientAccountStatus,
  retrieveRecipientAccountStatus: vi.fn(),
}));
vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("@/env", () => ({
  env: { ROASTER_APP_ORIGIN: "https://roaster.test" },
}));

import { POST } from "./route";

describe("POST /api/stripe/connect (roaster)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.database.user.findUnique.mockResolvedValue({
      roasterId: "roaster_1",
    });
    mocks.database.roaster.findUnique.mockResolvedValue({
      application: { businessName: "Demo Roaster" },
      email: "owner@example.com",
      id: "roaster_1",
      payoutsEnabled: false,
      stripeAccountId: null,
      stripeOnboarding: "NOT_STARTED",
    });
    mocks.createRecipientConnectedAccount.mockResolvedValue({ id: "acct_v2" });
    mocks.normalizeRecipientAccountStatus.mockReturnValue({
      onboardingComplete: true,
      readyToReceivePayments: true,
    });
    mocks.mapRecipientAccountStatusToOnboardingStatus.mockReturnValue(
      "COMPLETE"
    );
    mocks.createRecipientAccountLink.mockResolvedValue({
      url: "https://connect.stripe.test/link",
    });
  });

  it("creates a V2 recipient account and account link for a new roaster", async () => {
    const response = await POST();
    await expect(response.json()).resolves.toEqual({
      url: "https://connect.stripe.test/link",
    });

    expect(mocks.createRecipientConnectedAccount).toHaveBeenCalledWith({
      country: "US",
      displayName: "Demo Roaster",
      email: "owner@example.com",
      metadata: { joe_perks_roaster_id: "roaster_1" },
    });
    expect(mocks.database.roaster.update).toHaveBeenCalledWith({
      data: {
        chargesEnabled: true,
        payoutsEnabled: true,
        stripeAccountId: "acct_v2",
        stripeOnboarding: "COMPLETE",
      },
      where: { id: "roaster_1" },
    });
    expect(mocks.createRecipientAccountLink).toHaveBeenCalledWith({
      accountId: "acct_v2",
      refreshUrl: "https://roaster.test/onboarding?stripe_refresh=1",
      returnUrl: "https://roaster.test/onboarding?stripe_return=1",
      type: "account_update",
    });
  });
});
