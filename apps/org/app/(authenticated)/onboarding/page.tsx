import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";

import { ConnectStatus } from "./_components/connect-status";

type OnboardingSearchParams = Promise<{
  stripe_return?: string;
  stripe_refresh?: string;
}>;

export default async function OrgOnboardingPage({
  searchParams,
}: {
  searchParams: OnboardingSearchParams;
}) {
  const params = await searchParams;
  const stripeReturn = params.stripe_return === "1";
  const stripeRefresh = params.stripe_refresh === "1";

  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const dbUser = await database.user.findUnique({
    where: { externalAuthId: userId },
    select: { orgId: true },
  });

  if (!dbUser?.orgId) {
    return (
      <div className="p-6">
        <h1 className="font-semibold text-2xl">Payments onboarding</h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          No organization is linked to this account. If you were recently
          approved, try signing out and signing back in. Otherwise contact
          support.
        </p>
      </div>
    );
  }

  const org = await database.org.findUnique({
    where: { id: dbUser.orgId },
    select: {
      stripeOnboarding: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
  });

  if (!org) {
    return (
      <div className="p-6">
        <h1 className="font-semibold text-2xl">Payments onboarding</h1>
        <p className="mt-2 text-muted-foreground">
          Organization record not found. Contact support if this persists.
        </p>
      </div>
    );
  }

  const fullyOnboarded =
    org.stripeOnboarding === "COMPLETE" &&
    org.chargesEnabled &&
    org.payoutsEnabled;

  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl">Payments onboarding</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
        Connect Stripe Express to receive your share of fundraiser sales. Joe
        Perks uses destination charges; org payouts are transferred after the
        hold period.
      </p>

      <ConnectStatus
        chargesEnabled={org.chargesEnabled}
        fullyOnboarded={fullyOnboarded}
        payoutsEnabled={org.payoutsEnabled}
        stripeOnboarding={org.stripeOnboarding}
        stripeRefresh={stripeRefresh}
        stripeReturn={stripeReturn}
      />
    </div>
  );
}
