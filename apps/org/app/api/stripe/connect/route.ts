import { database } from "@joe-perks/db";
import {
  createRecipientAccountLink,
  createRecipientConnectedAccount,
  mapRecipientAccountStatusToOnboardingStatus,
  normalizeRecipientAccountStatus,
  resolveLiveConnectAccountId,
  retrieveRecipientAccountStatus,
} from "@joe-perks/stripe";
import { auth } from "@repo/auth/server";
import { NextResponse } from "next/server";

import { env } from "@/env";

export const runtime = "nodejs";

const TRAILING_SLASH = /\/$/;

function resolveOrgAppOrigin(): string {
  const origin = env.ORG_APP_ORIGIN?.trim();
  if (origin) {
    return origin.replace(TRAILING_SLASH, "");
  }
  return "http://localhost:3002";
}

/**
 * Starts or resumes Stripe Connect V2 recipient onboarding for the signed-in org.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await database.user.findUnique({
    where: { externalAuthId: userId },
  });
  if (!dbUser?.orgId) {
    return NextResponse.json({ error: "No org profile" }, { status: 403 });
  }

  const org = await database.org.findUnique({
    include: {
      application: { select: { orgName: true } },
    },
    where: { id: dbUser.orgId },
  });
  if (!org) {
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  }

  const base = resolveOrgAppOrigin();
  const refreshUrl = `${base}/onboarding?stripe_refresh=1`;
  const returnUrl = `${base}/onboarding?stripe_return=1`;

  let stripeAccountId = resolveLiveConnectAccountId(org.stripeAccountId);
  let onboardingStatus = org.stripeOnboarding;
  let readyToReceivePayments = org.payoutsEnabled;

  if (stripeAccountId) {
    const status = await retrieveRecipientAccountStatus(stripeAccountId);
    onboardingStatus = mapRecipientAccountStatusToOnboardingStatus(status);
    readyToReceivePayments = status.readyToReceivePayments;
    await database.org.update({
      where: { id: org.id },
      data: {
        chargesEnabled: readyToReceivePayments,
        payoutsEnabled: readyToReceivePayments,
        stripeOnboarding: onboardingStatus,
      },
    });
  } else {
    const account = await createRecipientConnectedAccount({
      country: "US",
      displayName: org.application.orgName,
      email: org.email,
      metadata: {
        joe_perks_org_id: org.id,
      },
    });
    stripeAccountId = account.id;
    const status = normalizeRecipientAccountStatus(account);
    onboardingStatus = mapRecipientAccountStatusToOnboardingStatus(status);
    readyToReceivePayments = status.readyToReceivePayments;
    await database.org.update({
      where: { id: org.id },
      data: {
        chargesEnabled: readyToReceivePayments,
        payoutsEnabled: readyToReceivePayments,
        stripeAccountId,
        stripeOnboarding: onboardingStatus,
      },
    });
  }

  const linkType =
    onboardingStatus === "COMPLETE" ? "account_update" : "account_onboarding";
  if (!stripeAccountId) {
    return NextResponse.json(
      { error: "Stripe account was not created" },
      { status: 500 }
    );
  }

  const accountLink = await createRecipientAccountLink({
    accountId: stripeAccountId,
    refreshUrl,
    returnUrl,
    type: linkType,
  });

  return NextResponse.json({ url: accountLink.url });
}
