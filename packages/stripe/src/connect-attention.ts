import type { RecipientAccountStatus } from "./connect";

export type ConnectAttentionTier =
  | "none"
  | "verification_pending"
  | "action_required"
  | "blocked";

export type ConnectAttentionVariant = "default" | "warning" | "destructive";

export interface ConnectAttentionContext {
  badgeLabel?: string;
  body: string;
  headline: string;
  /** Shown when roasters are sent to Stripe-hosted collection (Joe Perks never stores PII). */
  legalNote?: string;
  pendingItems: readonly string[];
  showStripeButton: boolean;
  stripeButtonLabel: string;
  tier: ConnectAttentionTier;
  variant: ConnectAttentionVariant;
}

interface RequirementEntry {
  description?: string | null;
  errors?: Array<{ description?: string | null }> | null;
}

interface AccountWithRequirements {
  future_requirements?: {
    entries?: RequirementEntry[] | null;
  } | null;
  requirements?: {
    entries?: RequirementEntry[] | null;
  } | null;
}

const STRIPE_HOSTED_COLLECTION_NOTE =
  "You'll submit these details on Stripe's secure site. Joe Perks notifies you when action is needed but does not collect or store SSN, date of birth, or bank account numbers.";

const NONE: ConnectAttentionContext = {
  body: "",
  headline: "",
  pendingItems: [],
  showStripeButton: false,
  stripeButtonLabel: "Start onboarding",
  tier: "none",
  variant: "default",
};

export function extractPendingRequirementDescriptions(
  account: AccountWithRequirements
): string[] {
  const entries = [
    ...(account.requirements?.entries ?? []),
    ...(account.future_requirements?.entries ?? []),
  ];

  const descriptions = entries
    .map((entry) => entry.description?.trim())
    .filter((description): description is string => Boolean(description));

  return [...new Set(descriptions)];
}

function hasRequirementErrors(status: RecipientAccountStatus): boolean {
  return (status.account.requirements?.entries ?? []).some(
    (entry) => (entry.errors?.length ?? 0) > 0
  );
}

export function resolveConnectAttentionForPortal(
  status: RecipientAccountStatus | null,
  options?: { supportEntity?: "business" | "organization" }
): ConnectAttentionContext {
  if (!status) {
    return {
      ...NONE,
      showStripeButton: true,
      stripeButtonLabel: "Start onboarding",
    };
  }

  return resolveConnectAttentionContext(status, options);
}

export function resolveConnectAttentionContext(
  status: RecipientAccountStatus,
  options?: { supportEntity?: "business" | "organization" }
): ConnectAttentionContext {
  const supportEntity = options?.supportEntity ?? "business";
  const pendingItems = extractPendingRequirementDescriptions(status.account);
  const {
    onboardingComplete,
    readyToReceivePayments,
    requirementsStatus,
    transferStatus,
  } = status;

  if (readyToReceivePayments && onboardingComplete) {
    return NONE;
  }

  if (
    requirementsStatus === "past_due" ||
    transferStatus === "unsupported" ||
    (hasRequirementErrors(status) && requirementsStatus === "currently_due")
  ) {
    return {
      tier: "blocked",
      headline: "Stripe account blocked",
      body: `Your account has overdue or invalid verification details. Contact Joe Perks support with your ${supportEntity} details if you need help resolving this.`,
      pendingItems,
      showStripeButton: false,
      stripeButtonLabel: "Update in Stripe",
      variant: "destructive",
    };
  }

  if (transferStatus === "restricted" && onboardingComplete) {
    const eventuallyDue = requirementsStatus === "eventually_due";

    return {
      tier: "verification_pending",
      badgeLabel: "Action needed",
      headline: eventuallyDue
        ? "Stripe is connected — a few details are still pending"
        : "Stripe is connected — verification still in progress",
      body: eventuallyDue
        ? "Your account is linked to Stripe. The items below may be required as your sales volume grows. Submit them now on Stripe to avoid payout delays when recipient transfers activate."
        : "Stripe is reviewing your account or waiting on a few details. Open Stripe to finish any remaining steps and activate recipient transfers.",
      legalNote: STRIPE_HOSTED_COLLECTION_NOTE,
      pendingItems,
      showStripeButton: true,
      stripeButtonLabel: "Update details in Stripe",
      variant: "warning",
    };
  }

  if (requirementsStatus === "currently_due") {
    return {
      tier: "action_required",
      badgeLabel: "Action needed",
      headline: "Finish Stripe onboarding",
      body: "Stripe needs a few more details before recipient transfers can activate.",
      legalNote: STRIPE_HOSTED_COLLECTION_NOTE,
      pendingItems,
      showStripeButton: true,
      stripeButtonLabel: "Continue onboarding",
      variant: "warning",
    };
  }

  if (transferStatus === "restricted") {
    return {
      tier: "action_required",
      badgeLabel: "Action needed",
      headline: "Stripe account needs attention",
      body: "Complete the remaining steps in Stripe before you can receive payouts.",
      legalNote: STRIPE_HOSTED_COLLECTION_NOTE,
      pendingItems,
      showStripeButton: true,
      stripeButtonLabel: "Continue onboarding",
      variant: "warning",
    };
  }

  return {
    ...NONE,
    legalNote: STRIPE_HOSTED_COLLECTION_NOTE,
    showStripeButton: true,
    stripeButtonLabel: onboardingComplete
      ? "Continue onboarding"
      : "Start onboarding",
  };
}
