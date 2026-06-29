import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createRecipientAccountLink: vi.fn(),
  createRecipientConnectedAccount: vi.fn(),
  database: {
    org: { findUnique: vi.fn(), update: vi.fn() },
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
  resolveLiveConnectAccountId: (id: string | null) =>
    id?.startsWith("acct_e2e_") ? null : id,
  retrieveRecipientAccountStatus: vi.fn(),
}));
vi.mock("@repo/auth/server", () => ({ auth: mocks.auth }));
vi.mock("@/env", () => ({
  env: { ORG_APP_ORIGIN: "https://org.test" },
}));

import { POST } from "./route";

describe("POST /api/stripe/connect (org)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "user_1" });
    mocks.database.user.findUnique.mockResolvedValue({ orgId: "org_1" });
    mocks.database.org.findUnique.mockResolvedValue({
      application: { orgName: "Demo Org" },
      email: "treasurer@example.com",
      id: "org_1",
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

  it("creates a V2 marketplace account and account link for a new org", async () => {
    const response = await POST();
    await expect(response.json()).resolves.toEqual({
      url: "https://connect.stripe.test/link",
    });

    expect(mocks.createRecipientConnectedAccount).toHaveBeenCalledWith({
      country: "US",
      displayName: "Demo Org",
      email: "treasurer@example.com",
      metadata: { joe_perks_org_id: "org_1" },
    });
    expect(mocks.database.org.update).toHaveBeenCalledWith({
      data: {
        chargesEnabled: true,
        payoutsEnabled: true,
        stripeAccountId: "acct_v2",
        stripeOnboarding: "COMPLETE",
      },
      where: { id: "org_1" },
    });
    expect(mocks.createRecipientAccountLink).toHaveBeenCalledWith({
      accountId: "acct_v2",
      refreshUrl: "https://org.test/onboarding?stripe_refresh=1",
      returnUrl: "https://org.test/onboarding?stripe_return=1",
      type: "account_update",
    });
  });

  it("creates a live Connect account when the org has an E2E placeholder id", async () => {
    mocks.database.org.findUnique.mockResolvedValue({
      application: { orgName: "Demo Org" },
      email: "treasurer@example.com",
      id: "org_1",
      payoutsEnabled: true,
      stripeAccountId: "acct_e2e_org_cmo7y279",
      stripeOnboarding: "COMPLETE",
    });

    const response = await POST();
    await expect(response.json()).resolves.toEqual({
      url: "https://connect.stripe.test/link",
    });

    expect(mocks.createRecipientConnectedAccount).toHaveBeenCalled();
    expect(mocks.database.org.update).toHaveBeenCalledWith({
      data: expect.objectContaining({ stripeAccountId: "acct_v2" }),
      where: { id: "org_1" },
    });
  });
});
