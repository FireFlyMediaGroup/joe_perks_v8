import "server-only";

import type Stripe from "stripe";

import { getStripe } from "./client";

type StripeClient = InstanceType<typeof Stripe>;
const CONNECT_ACCOUNT_INCLUDES = [
  "configuration.customer",
  "configuration.merchant",
  "configuration.recipient",
  "defaults",
  "identity",
  "requirements",
] as const;
const CONNECT_ONBOARDING_CONFIGURATIONS = ["recipient", "merchant"] as const;

export interface CreateRecipientAccountParams {
  /** ISO country code; Joe Perks MVP is US-only unless extended. */
  country: string;
  displayName: string;
  email: string;
  metadata: Record<string, string>;
}

/**
 * Creates a Stripe Connect V2 account for Joe Perks marketplace sellers/fundraisers.
 *
 * Payments stay on the platform first; after the fulfillment/dispute hold, Joe Perks
 * sends separate transfers to connected accounts.
 */
export function createRecipientConnectedAccount(
  params: CreateRecipientAccountParams
): ReturnType<StripeClient["v2"]["core"]["accounts"]["create"]> {
  const stripe = getStripe();

  return stripe.v2.core.accounts.create({
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
    contact_email: params.email,
    dashboard: "express",
    defaults: {
      responsibilities: {
        fees_collector: "application",
        losses_collector: "application",
      },
    },
    display_name: params.displayName,
    identity: { country: params.country },
    include: [...CONNECT_ACCOUNT_INCLUDES],
    metadata: params.metadata,
  });
}

export interface CreateRecipientAccountLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type?: "account_onboarding" | "account_update";
}

export function createRecipientAccountLink(
  params: CreateRecipientAccountLinkParams
): ReturnType<StripeClient["v2"]["core"]["accountLinks"]["create"]> {
  const stripe = getStripe();

  return stripe.v2.core.accountLinks.create({
    account: params.accountId,
    use_case:
      params.type === "account_update"
        ? {
            account_update: {
              configurations: [...CONNECT_ONBOARDING_CONFIGURATIONS],
              refresh_url: params.refreshUrl,
              return_url: params.returnUrl,
            },
            type: "account_update",
          }
        : {
            account_onboarding: {
              configurations: [...CONNECT_ONBOARDING_CONFIGURATIONS],
              refresh_url: params.refreshUrl,
              return_url: params.returnUrl,
            },
            type: "account_onboarding",
          },
  });
}

export async function retrieveRecipientAccountStatus(
  accountId: string
): Promise<RecipientAccountStatus> {
  const stripe = getStripe();
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: [...CONNECT_ACCOUNT_INCLUDES],
  });

  return normalizeRecipientAccountStatus(account);
}

export type RecipientAccount = Awaited<
  ReturnType<StripeClient["v2"]["core"]["accounts"]["retrieve"]>
>;

export type RecipientTransferStatus =
  | "active"
  | "pending"
  | "restricted"
  | "unsupported";

export type RecipientRequirementsStatus =
  | "currently_due"
  | "eventually_due"
  | "past_due";

export interface RecipientAccountStatus {
  account: RecipientAccount;
  onboardingComplete: boolean;
  readyToReceivePayments: boolean;
  requirementsStatus: RecipientRequirementsStatus | null;
  transferStatus: RecipientTransferStatus | null;
}

export function normalizeRecipientAccountStatus(
  account: RecipientAccount
): RecipientAccountStatus {
  const transferStatus =
    account.configuration?.recipient?.capabilities?.stripe_balance
      ?.stripe_transfers?.status ?? null;
  const requirementsStatus =
    account.requirements?.summary?.minimum_deadline?.status ?? null;

  return {
    account,
    onboardingComplete:
      requirementsStatus !== "currently_due" &&
      requirementsStatus !== "past_due",
    readyToReceivePayments: transferStatus === "active",
    requirementsStatus,
    transferStatus,
  };
}
