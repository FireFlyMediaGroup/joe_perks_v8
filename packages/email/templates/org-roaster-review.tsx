import { Button, Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: platform approved org application → roaster reviews via magic link (US-03-02).
 */
export const ORG_ROASTER_REVIEW_SUBJECT =
  "Action needed: review a fundraising organization";

interface OrgRoasterReviewEmailProps {
  readonly contactName: string;
  readonly description: string | null;
  readonly orgName: string;
  readonly reviewUrl: string;
  readonly roasterBusinessName: string;
}

export const OrgRoasterReviewEmail = ({
  roasterBusinessName,
  orgName,
  contactName,
  description,
  reviewUrl,
}: OrgRoasterReviewEmailProps) => (
  <BaseEmailLayout preview={`Review ${orgName} on Joe Perks`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Review organization application
    </Text>
    <Text className="m-0 text-zinc-600">
      Hi {roasterBusinessName}, an organization has been approved by Joe Perks
      and is requesting to partner with you for fundraising.
    </Text>
    <Text className="mt-4 mb-1 font-semibold text-sm text-zinc-900">
      Organization
    </Text>
    <Text className="m-0 text-zinc-600">
      <strong>{orgName}</strong>
    </Text>
    <Text className="mt-3 mb-1 font-semibold text-sm text-zinc-900">
      Primary contact
    </Text>
    <Text className="m-0 text-zinc-600">{contactName}</Text>
    {description ? (
      <>
        <Text className="mt-3 mb-1 font-semibold text-sm text-zinc-900">
          Description
        </Text>
        <Text className="m-0 whitespace-pre-wrap text-zinc-600">
          {description}
        </Text>
      </>
    ) : null}
    <Text className="m-0 mt-6 text-zinc-600">
      Please open the link below to approve or decline this partnership. This
      link expires in 72 hours.
    </Text>
    <Button
      className="mt-8 rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-sm text-white"
      href={reviewUrl}
    >
      Review application
    </Button>
    <Text className="m-0 mt-6 text-sm text-zinc-500">
      Questions? Reply to this email or contact support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

OrgRoasterReviewEmail.PreviewProps = {
  roasterBusinessName: "North Star Roasting Co.",
  orgName: "Lincoln High School Boosters",
  contactName: "Jamie Chen",
  description:
    "We run annual athletics fundraisers and would love to offer your coffee.",
  reviewUrl: "https://roasters.joeperks.com/org-requests/abc123token",
};

export default OrgRoasterReviewEmail;
