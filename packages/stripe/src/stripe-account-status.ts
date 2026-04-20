import type Stripe from "stripe";

/** Mirrors Prisma `StripeOnboardingStatus` string values (no `@joe-perks/db` import). */
export type MappedStripeOnboardingStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "COMPLETE"
  | "RESTRICTED";

/**
 * Maps a Stripe Connect Account to onboarding status for `Roaster` / `Org` rows.
 */
export function mapStripeAccountToOnboardingStatus(
  account: Stripe.Account
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
