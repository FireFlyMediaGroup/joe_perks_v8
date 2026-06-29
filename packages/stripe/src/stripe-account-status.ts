import type { RecipientAccountStatus } from "./connect";

/** Mirrors Prisma `StripeOnboardingStatus` string values (no `@joe-perks/db` import). */
export type MappedStripeOnboardingStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "COMPLETE"
  | "RESTRICTED";

export interface LegacyStripeAccountStatusInput {
  charges_enabled?: boolean;
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  requirements?: {
    disabled_reason?: string | null;
  } | null;
}

/**
 * Maps a Stripe Connect Account to onboarding status for `Roaster` / `Org` rows.
 */
export function mapStripeAccountToOnboardingStatus(
  account: LegacyStripeAccountStatusInput
): MappedStripeOnboardingStatus {
  if (account.requirements?.disabled_reason) {
    return "RESTRICTED";
  }
  if (
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted
  ) {
    return "COMPLETE";
  }
  if (!account.details_submitted) {
    return "NOT_STARTED";
  }
  return "PENDING";
}

export function mapRecipientAccountStatusToOnboardingStatus(
  status: RecipientAccountStatus
): MappedStripeOnboardingStatus {
  if (status.requirementsStatus === "past_due") {
    return "RESTRICTED";
  }

  if (status.transferStatus === "unsupported") {
    return "RESTRICTED";
  }

  if (status.readyToReceivePayments && status.onboardingComplete) {
    return "COMPLETE";
  }

  if (status.requirementsStatus === "currently_due") {
    return "NOT_STARTED";
  }

  if (
    status.transferStatus === "restricted" &&
    status.onboardingComplete
  ) {
    return "PENDING";
  }

  if (status.transferStatus === "restricted") {
    return "RESTRICTED";
  }

  return "PENDING";
}
