import "server-only";

import type Stripe from "stripe";

import { getStripe } from "./client";

export interface CreateExpressAccountParams {
  /** ISO country code; Joe Perks MVP is US-only unless extended. */
  country?: string;
  email: string;
  metadata: Record<string, string>;
}

/**
 * Creates a Stripe Connect **Express** connected account (see `docs/AGENTS.md`).
 */
export function createExpressConnectedAccount(
  params: CreateExpressAccountParams
): Promise<Stripe.Account> {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: "express",
    country: params.country ?? "US",
    email: params.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: params.metadata,
  });
}

export interface CreateExpressAccountLinkParams {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
  type?: "account_onboarding" | "account_update";
}

export function createExpressAccountLink(
  params: CreateExpressAccountLinkParams
): Promise<Stripe.AccountLink> {
  const stripe = getStripe();
  return stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: params.type ?? "account_onboarding",
  });
}
