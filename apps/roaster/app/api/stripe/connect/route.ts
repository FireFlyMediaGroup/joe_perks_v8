import { database } from "@joe-perks/db";
import {
  createExpressAccountLink,
  createExpressConnectedAccount,
  mapStripeAccountToOnboardingStatus,
} from "@joe-perks/stripe";
import { auth } from "@repo/auth/server";
import { NextResponse } from "next/server";

import { env } from "@/env";

export const runtime = "nodejs";

const TRAILING_SLASH = /\/$/;

function resolveAppOrigin(): string {
  const origin = env.ROASTER_APP_ORIGIN?.trim();
  if (origin) {
    return origin.replace(TRAILING_SLASH, "");
  }
  return "http://localhost:3001";
}

/**
 * Starts or resumes Stripe Connect Express onboarding for the signed-in roaster.
 * Returns a Stripe-hosted URL (redirect the browser there).
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await database.user.findUnique({
    where: { externalAuthId: userId },
  });
  if (!dbUser?.roasterId) {
    return NextResponse.json({ error: "No roaster profile" }, { status: 403 });
  }

  const roaster = await database.roaster.findUnique({
    where: { id: dbUser.roasterId },
  });
  if (!roaster) {
    return NextResponse.json({ error: "Roaster not found" }, { status: 404 });
  }

  const base = resolveAppOrigin();
  const refreshUrl = `${base}/onboarding?stripe_refresh=1`;
  const returnUrl = `${base}/onboarding?stripe_return=1`;

  let stripeAccountId = roaster.stripeAccountId;
  let onboardingStatus = roaster.stripeOnboarding;

  if (!stripeAccountId) {
    const account = await createExpressConnectedAccount({
      email: roaster.email,
      metadata: {
        joe_perks_roaster_id: roaster.id,
      },
    });
    stripeAccountId = account.id;
    onboardingStatus = mapStripeAccountToOnboardingStatus(account);
    await database.roaster.update({
      where: { id: roaster.id },
      data: {
        stripeAccountId,
        stripeOnboarding: onboardingStatus,
      },
    });
  }

  const linkType =
    onboardingStatus === "COMPLETE" ? "account_update" : "account_onboarding";

  const accountLink = await createExpressAccountLink({
    accountId: stripeAccountId,
    refreshUrl,
    returnUrl,
    type: linkType,
  });

  return NextResponse.json({ url: accountLink.url });
}
