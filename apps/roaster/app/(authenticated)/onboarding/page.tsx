import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";

import { ConnectStatus } from "./_components/connect-status";

type OnboardingSearchParams = Promise<{
  stripe_return?: string;
  stripe_refresh?: string;
}>;

export default async function RoasterOnboardingPage({
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
    select: { roasterId: true },
  });

  if (!dbUser?.roasterId) {
    return (
      <div className="p-6">
        <h1 className="font-semibold text-2xl">Payments onboarding</h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          No roaster profile is linked to this account. If you were recently
          approved, try signing out and signing back in. Otherwise contact
          support.
        </p>
      </div>
    );
  }

  const roaster = await database.roaster.findUnique({
    where: { id: dbUser.roasterId },
    select: {
      stripeOnboarding: true,
      chargesEnabled: true,
      payoutsEnabled: true,
    },
  });

  if (!roaster) {
    return (
      <div className="p-6">
        <h1 className="font-semibold text-2xl">Payments onboarding</h1>
        <p className="mt-2 text-muted-foreground">
          Roaster record not found. Contact support if this persists.
        </p>
      </div>
    );
  }

  const fullyOnboarded =
    roaster.stripeOnboarding === "COMPLETE" &&
    roaster.chargesEnabled &&
    roaster.payoutsEnabled;

  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl">Payments onboarding</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
        Connect Stripe Express to receive payouts. Joe Perks uses destination
        charges; your earnings are transferred after the payout hold period.
      </p>

      <ConnectStatus
        chargesEnabled={roaster.chargesEnabled}
        fullyOnboarded={fullyOnboarded}
        payoutsEnabled={roaster.payoutsEnabled}
        stripeOnboarding={roaster.stripeOnboarding}
        stripeRefresh={stripeRefresh}
        stripeReturn={stripeReturn}
      />
    </div>
  );
}
