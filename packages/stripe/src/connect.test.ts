import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  accountLinksCreate: vi.fn(),
  accountsCreate: vi.fn(),
  accountsRetrieve: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./client", () => ({
  getStripe: () => ({
    v2: {
      core: {
        accountLinks: { create: mocks.accountLinksCreate },
        accounts: {
          create: mocks.accountsCreate,
          retrieve: mocks.accountsRetrieve,
        },
      },
    },
  }),
}));

import {
  CONNECT_ACCOUNT_LINK_COLLECTION_OPTIONS,
  createRecipientAccountLink,
  createRecipientConnectedAccount,
  isPlaceholderConnectAccountId,
  resolveLiveConnectAccountId,
  retrieveRecipientAccountStatus,
} from "./connect";

const expectedAccountIncludes = [
  "configuration.customer",
  "configuration.merchant",
  "configuration.recipient",
  "defaults",
  "future_requirements",
  "identity",
  "requirements",
];

describe("Connect V2 helper payloads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects E2E placeholder Connect account ids", () => {
    expect(isPlaceholderConnectAccountId("acct_e2e_roaster_cmo7y03d")).toBe(
      true
    );
    expect(isPlaceholderConnectAccountId("acct_1Nabc")).toBe(false);
    expect(isPlaceholderConnectAccountId(null)).toBe(false);
    expect(resolveLiveConnectAccountId("acct_e2e_org_abc")).toBeNull();
    expect(resolveLiveConnectAccountId("acct_live123")).toBe("acct_live123");
  });

  it("creates merchant + recipient marketplace accounts for delayed transfers", () => {
    createRecipientConnectedAccount({
      country: "US",
      displayName: "Demo Roaster",
      email: "owner@example.com",
      metadata: { joe_perks_roaster_id: "roaster_1" },
    });

    expect(mocks.accountsCreate).toHaveBeenCalledWith({
      configuration: {
        merchant: {},
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      contact_email: "owner@example.com",
      dashboard: "express",
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      display_name: "Demo Roaster",
      identity: { country: "US" },
      include: expectedAccountIncludes,
      metadata: { joe_perks_roaster_id: "roaster_1" },
    });
  });

  it("collects recipient and merchant requirements in hosted onboarding links", () => {
    createRecipientAccountLink({
      accountId: "acct_123",
      refreshUrl: "https://roasters.test/onboarding?stripe_refresh=1",
      returnUrl: "https://roasters.test/onboarding?stripe_return=1",
    });

    expect(mocks.accountLinksCreate).toHaveBeenCalledWith({
      account: "acct_123",
      use_case: {
        account_onboarding: {
          collection_options: CONNECT_ACCOUNT_LINK_COLLECTION_OPTIONS,
          configurations: ["recipient", "merchant"],
          refresh_url: "https://roasters.test/onboarding?stripe_refresh=1",
          return_url: "https://roasters.test/onboarding?stripe_return=1",
        },
        type: "account_onboarding",
      },
    });
  });

  it("includes future requirements in account update links", () => {
    createRecipientAccountLink({
      accountId: "acct_123",
      refreshUrl: "https://roasters.test/onboarding?stripe_refresh=1",
      returnUrl: "https://roasters.test/onboarding?stripe_return=1",
      type: "account_update",
    });

    expect(mocks.accountLinksCreate).toHaveBeenCalledWith({
      account: "acct_123",
      use_case: {
        account_update: {
          collection_options: CONNECT_ACCOUNT_LINK_COLLECTION_OPTIONS,
          configurations: ["recipient", "merchant"],
          refresh_url: "https://roasters.test/onboarding?stripe_refresh=1",
          return_url: "https://roasters.test/onboarding?stripe_return=1",
        },
        type: "account_update",
      },
    });
  });

  it("retrieves the full marketplace account shape needed for status refresh", async () => {
    mocks.accountsRetrieve.mockResolvedValue({
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { status: "active" },
            },
          },
        },
      },
      requirements: {
        summary: {
          minimum_deadline: { status: "eventually_due" },
        },
      },
    });

    await expect(
      retrieveRecipientAccountStatus("acct_123")
    ).resolves.toMatchObject({
      onboardingComplete: true,
      readyToReceivePayments: true,
      requirementsStatus: "eventually_due",
      transferStatus: "active",
    });

    expect(mocks.accountsRetrieve).toHaveBeenCalledWith("acct_123", {
      include: expectedAccountIncludes,
    });
  });
});
