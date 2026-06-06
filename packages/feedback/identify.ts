import "server-only";
import { createHmac } from "node:crypto";
import { keys } from "./keys";
import type { FeedbackIdentity } from "./widget";

/**
 * Build a Featurebase identity for a signed-in portal user, to pass to
 * `<FeedbackWidget identity={...} />`.
 *
 * Call this in a Server Component / server action with values from the Clerk
 * session (`@repo/auth/server`), e.g.:
 *
 *   const { userId } = await auth();
 *   const user = await currentUser();
 *   const identity = buildFeedbackIdentity({
 *     userId,
 *     email: user.primaryEmailAddress.emailAddress,
 *     name: user.fullName ?? undefined,
 *     companyName: roaster?.name ?? org?.name,
 *   });
 */
export const buildFeedbackIdentity = (input: {
  userId: string;
  email: string;
  name?: string;
  companyName?: string;
}): FeedbackIdentity => {
  const secret = keys().FEATUREBASE_SSO_SECRET;

  // When an SSO secret is configured, sign an identity hash so Featurebase trusts
  // the email/name without a second sign-in. The exact signing scheme (HMAC payload
  // vs. a full JWT) is provider-specific — confirm against the current Featurebase
  // "Identity verification" docs before enabling in production.
  const userHash = secret
    ? createHmac("sha256", secret).update(input.userId).digest("hex")
    : undefined;

  return {
    userId: input.userId,
    email: input.email,
    name: input.name,
    companyName: input.companyName,
    userHash,
  };
};
