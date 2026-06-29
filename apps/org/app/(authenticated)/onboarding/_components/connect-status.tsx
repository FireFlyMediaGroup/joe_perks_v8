"use client";

import type { ConnectAttentionContext } from "@joe-perks/stripe/connect-attention";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

import { useStripeRefreshRedirect } from "../_hooks/use-stripe-refresh-redirect";
import { StartOnboardingButton } from "./start-onboarding-button";

export type StripeOnboardingState =
  | "NOT_STARTED"
  | "PENDING"
  | "COMPLETE"
  | "RESTRICTED";

interface ConnectStatusProps {
  readonly attention: ConnectAttentionContext;
  readonly fullyOnboarded: boolean;
  readonly onboardingComplete: boolean;
  readonly readyToReceivePayments: boolean;
  readonly stripeOnboarding: StripeOnboardingState;
  readonly stripeRefresh: boolean;
  readonly stripeReturn: boolean;
}

function statusBadgeVariant(
  status: StripeOnboardingState,
  attention: ConnectAttentionContext
): "default" | "secondary" | "destructive" | "outline" {
  if (attention.badgeLabel) {
    return attention.variant === "destructive" ? "destructive" : "secondary";
  }

  switch (status) {
    case "COMPLETE":
      return "default";
    case "PENDING":
      return "secondary";
    case "RESTRICTED":
      return "destructive";
    default:
      return "outline";
  }
}

function statusLabel(
  status: StripeOnboardingState,
  attention: ConnectAttentionContext
): string {
  if (attention.badgeLabel) {
    return attention.badgeLabel;
  }

  switch (status) {
    case "NOT_STARTED":
      return "Not started";
    case "PENDING":
      return "In progress";
    case "COMPLETE":
      return "Complete";
    case "RESTRICTED":
      return "Restricted";
    default:
      return status;
  }
}

function FlagRow({
  enabled,
  label,
}: {
  readonly enabled: boolean;
  readonly label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <CheckCircle2 aria-hidden className="size-4 shrink-0 text-green-600" />
      ) : (
        <Circle aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span>{label}</span>
    </div>
  );
}

function AttentionAlert({
  attention,
}: {
  readonly attention: ConnectAttentionContext;
}) {
  const isWarning = attention.variant === "warning";
  const borderClass = isWarning
    ? "border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
    : "border-destructive/40 bg-destructive/5 text-destructive";
  const Icon = isWarning ? AlertTriangle : XCircle;
  const iconClass = isWarning ? "text-amber-600" : "text-destructive";

  return (
    <div
      className={`max-w-lg rounded-lg border px-3 py-3 text-sm ${borderClass}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
        <div className="space-y-2">
          <p className="font-medium">{attention.headline}</p>
          <p>{attention.body}</p>
          {attention.pendingItems.length > 0 ? (
            <div>
              <p className="font-medium">Stripe may ask for:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {attention.pendingItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {attention.legalNote ? (
            <p className="text-xs opacity-90">{attention.legalNote}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OnboardingSuccessCard() {
  return (
    <Card className="mt-6 max-w-lg border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 aria-hidden className="size-5 text-green-600" />
          Stripe is connected
        </CardTitle>
        <CardDescription>
          Your organization can receive fundraiser payouts from Joe Perks
          orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Link
          className="font-medium text-primary text-sm underline-offset-4 hover:underline"
          href="/campaign"
        >
          Set up your campaign
        </Link>
        <Link
          className="font-medium text-primary text-sm underline-offset-4 hover:underline"
          href="/dashboard"
        >
          Dashboard
        </Link>
      </CardContent>
    </Card>
  );
}

export function ConnectStatus({
  attention,
  stripeOnboarding,
  fullyOnboarded,
  onboardingComplete,
  readyToReceivePayments,
  stripeReturn,
  stripeRefresh,
}: ConnectStatusProps) {
  const { refreshError, refreshRedirecting } =
    useStripeRefreshRedirect(stripeRefresh);

  if (fullyOnboarded) {
    return <OnboardingSuccessCard />;
  }

  const showStartButton =
    !(stripeRefresh || refreshRedirecting) && attention.showStripeButton;

  let buttonLabel = "Start onboarding";
  if (attention.showStripeButton) {
    buttonLabel = attention.stripeButtonLabel;
  } else if (stripeOnboarding === "PENDING") {
    buttonLabel = "Continue onboarding";
  }

  const showAttentionAlert = attention.tier !== "none";
  const showFallbackRestrictedAlert =
    stripeOnboarding === "RESTRICTED" && attention.tier === "none";

  return (
    <div className="mt-6 space-y-6">
      {stripeReturn && !stripeRefresh ? (
        <output
          aria-live="polite"
          className="block max-w-lg rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-900 text-sm dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
        >
          You returned from Stripe. Status below is loaded from your account.
        </output>
      ) : null}

      {stripeRefresh && refreshRedirecting ? (
        <p className="text-muted-foreground text-sm">
          Opening a fresh Stripe link…
        </p>
      ) : null}

      {stripeRefresh && refreshError ? (
        <div
          className="max-w-lg rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive text-sm"
          role="alert"
        >
          <p>{refreshError}</p>
          <StartOnboardingButton label="Try again" />
        </div>
      ) : null}

      {showAttentionAlert ? <AttentionAlert attention={attention} /> : null}

      {showFallbackRestrictedAlert ? (
        <div
          className="max-w-lg rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <XCircle
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-destructive"
            />
            <p>
              Your Stripe account needs attention before you can receive
              payouts. Contact Joe Perks support with your organization details.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Connection status</CardTitle>
          <CardDescription>
            Stripe Express recipient onboarding for delayed transfers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Onboarding</span>
            <Badge variant={statusBadgeVariant(stripeOnboarding, attention)}>
              {statusLabel(stripeOnboarding, attention)}
            </Badge>
          </div>
          <div className="space-y-2 border-t pt-4">
            <FlagRow
              enabled={readyToReceivePayments}
              label="Recipient transfers active"
            />
            <FlagRow
              enabled={onboardingComplete}
              label="Required information complete"
            />
          </div>
          {attention.tier === "none" ? (
            <p className="text-muted-foreground text-sm">
              {stripeOnboarding === "NOT_STARTED"
                ? "Connect your bank account and organization details with Stripe to receive payouts."
                : "Finish the remaining steps in Stripe to activate recipient transfers."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {showStartButton ? <StartOnboardingButton label={buttonLabel} /> : null}
    </div>
  );
}
