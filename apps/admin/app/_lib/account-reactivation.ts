import type { OrgStatus, RoasterStatus, StripeOnboardingStatus } from "@joe-perks/db";

export interface AccountReactivationReadinessInput {
  chargesEnabled: boolean;
  openDisputesCount: number;
  openOrderCount: number;
  payoutsEnabled: boolean;
  stripeOnboarding: StripeOnboardingStatus;
  unsettledDebtCount: number;
}

export interface AccountReactivationReadiness {
  blockers: string[];
  defaultCanReactivate: boolean;
  nextStatus: OrgStatus | RoasterStatus;
  requiresOverride: boolean;
  stripeReady: boolean;
  stripeRequirements: string[];
}

export function getAccountReactivationReadiness(
  input: AccountReactivationReadinessInput
): AccountReactivationReadiness {
  const blockers: string[] = [];

  if (input.openDisputesCount > 0) {
    blockers.push(
      `${input.openDisputesCount} open dispute${input.openDisputesCount === 1 ? "" : "s"}`
    );
  }

  if (input.unsettledDebtCount > 0) {
    blockers.push(
      `${input.unsettledDebtCount} unsettled debt item${input.unsettledDebtCount === 1 ? "" : "s"}`
    );
  }

  if (input.openOrderCount > 0) {
    blockers.push(
      `${input.openOrderCount} open fulfillment obligation${input.openOrderCount === 1 ? "" : "s"}`
    );
  }

  const stripeRequirements: string[] = [];

  if (input.stripeOnboarding !== "COMPLETE") {
    stripeRequirements.push("Stripe onboarding is not complete");
  }

  if (!input.chargesEnabled) {
    stripeRequirements.push("Stripe charges are not enabled");
  }

  if (!input.payoutsEnabled) {
    stripeRequirements.push("Stripe payouts are not enabled");
  }

  const stripeReady = stripeRequirements.length === 0;

  return {
    blockers,
    defaultCanReactivate: stripeReady && blockers.length === 0,
    nextStatus: stripeReady ? "ACTIVE" : "ONBOARDING",
    requiresOverride: blockers.length > 0,
    stripeReady,
    stripeRequirements,
  };
}
