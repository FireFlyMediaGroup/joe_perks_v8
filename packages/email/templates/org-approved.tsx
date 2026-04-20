import { Button, Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: roaster approved org partnership (US-03-03).
 */
export const ORG_APPROVED_SUBJECT =
  "You're approved — complete setup on the Joe Perks org portal";

interface OrgApprovedEmailProps {
  readonly contactName: string;
  readonly loginUrl: string;
  readonly orgName: string;
}

export const OrgApprovedEmail = ({
  orgName,
  contactName,
  loginUrl,
}: OrgApprovedEmailProps) => (
  <BaseEmailLayout preview={`${orgName} is ready to finish onboarding`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Your organization is approved
    </Text>
    <Text className="m-0 text-zinc-600">
      Hi {contactName}, great news — a roaster partner has approved{" "}
      <strong>{orgName}</strong> to fundraise on Joe Perks.
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      Sign in to the organization portal to connect payouts (Stripe Express) and
      create your first campaign.
    </Text>
    <Button
      className="mt-8 rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-sm text-white"
      href={loginUrl}
    >
      Go to org portal
    </Button>
    <Text className="m-0 mt-6 text-sm text-zinc-500">
      If you have questions, reply to this email or contact
      support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

OrgApprovedEmail.PreviewProps = {
  orgName: "Lincoln High School Boosters",
  contactName: "Jamie Chen",
  loginUrl: "https://orgs.joeperks.com/sign-in",
};

export default OrgApprovedEmail;
