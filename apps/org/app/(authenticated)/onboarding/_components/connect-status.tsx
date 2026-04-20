"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import Link from "next/link";

import { useStripeRefreshRedirect } from "../_hooks/use-stripe-refresh-redirect";
import { StartOnboardingButton } from "./start-onboarding-button";

export type StripeOnboardingState =
  | "NOT_STARTED"
  | "PENDING"
  | "COMPLETE"
  | "RESTRICTED";

interface ConnectStatusProps {
  readonly chargesEnabled: boolean;
  readonly fullyOnboarded: boolean;
  readonly payoutsEnabled: boolean;
  readonly stripeOnboarding: StripeOnboardingState;
  readonly stripeRefresh: boolean;
  readonly stripeReturn: boolean;
}

function statusBadgeVariant(
  status: StripeOnboardingState
): "default" | "secondary" | "destructive" | "outline" {
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

function statusLabel(status: StripeOnboardingState): string {
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
  stripeOnboarding,
  chargesEnabled,
  payoutsEnabled,
  fullyOnboarded,
  stripeReturn,
  stripeRefresh,
}: ConnectStatusProps) {
  const { refreshError, refreshRedirecting } =
    useStripeRefreshRedirect(stripeRefresh);

  if (fullyOnboarded) {
    return <OnboardingSuccessCard />;
  }

  const showStartButton =
    !(stripeRefresh || refreshRedirecting) && stripeOnboarding !== "RESTRICTED";

  const buttonLabel =
    stripeOnboarding === "PENDING" ? "Continue onboarding" : "Start onboarding";

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

      {stripeOnboarding === "RESTRICTED" ? (
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
            Stripe Express onboarding for org payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">Onboarding</span>
            <Badge variant={statusBadgeVariant(stripeOnboarding)}>
              {statusLabel(stripeOnboarding)}
            </Badge>
          </div>
          <div className="space-y-2 border-t pt-4">
            <FlagRow enabled={chargesEnabled} label="Charges enabled" />
            <FlagRow enabled={payoutsEnabled} label="Payouts enabled" />
          </div>
          {!fullyOnboarded && stripeOnboarding !== "RESTRICTED" ? (
            <p className="text-muted-foreground text-sm">
              {stripeOnboarding === "NOT_STARTED"
                ? "Connect your bank account and organization details with Stripe to receive payouts."
                : "Finish the remaining steps in Stripe to enable charges and payouts."}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {showStartButton ? <StartOnboardingButton label={buttonLabel} /> : null}
    </div>
  );
}
