import { database } from "@joe-perks/db";

import { OrgReviewDetails } from "../_components/org-review-details";
import { ReviewActions } from "../_components/review-actions";
import { TokenError } from "../_components/token-error";
import { parseRoasterReviewPayload } from "../_lib/roaster-review-payload";

interface OrgRequestReviewPageProps {
  readonly params: Promise<{ token: string }>;
}

export default async function OrgRequestReviewPage({
  params,
}: OrgRequestReviewPageProps) {
  const { token } = await params;

  if (!token) {
    return <TokenError variant="invalid" />;
  }

  const link = await database.magicLink.findUnique({
    where: { token },
  });

  if (!link) {
    return <TokenError variant="invalid" />;
  }

  if (link.purpose !== "ROASTER_REVIEW") {
    return <TokenError variant="invalid" />;
  }

  if (link.usedAt) {
    return <TokenError variant="used" />;
  }

  if (link.expiresAt <= new Date()) {
    return <TokenError variant="expired" />;
  }

  const payload = parseRoasterReviewPayload(link.payload);
  if (!payload) {
    return <TokenError variant="invalid" />;
  }

  if (link.actorType !== "ROASTER" || link.actorId !== payload.roasterId) {
    return <TokenError variant="invalid" />;
  }

  const application = await database.orgApplication.findUnique({
    where: { id: payload.applicationId },
  });

  if (!application) {
    return <TokenError variant="invalid" />;
  }

  if (application.status === "APPROVED" || application.status === "REJECTED") {
    return <TokenError variant="already_decided" />;
  }

  if (application.status !== "PENDING_ROASTER_APPROVAL") {
    return <TokenError variant="wrong_state" />;
  }

  const request = await database.roasterOrgRequest.findUnique({
    where: {
      applicationId_roasterId: {
        applicationId: application.id,
        roasterId: payload.roasterId,
      },
    },
  });

  if (!request) {
    return <TokenError variant="invalid" />;
  }

  if (request.status !== "PENDING") {
    return <TokenError variant="already_decided" />;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <OrgReviewDetails
        contactName={application.contactName}
        description={application.description}
        desiredOrgPct={application.desiredOrgPct}
        desiredSlug={application.desiredSlug}
        email={application.email}
        orgName={application.orgName}
        phone={application.phone}
      />
      <div className="mt-8">
        <ReviewActions token={token} />
      </div>
    </main>
  );
}
