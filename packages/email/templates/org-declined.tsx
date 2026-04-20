import { Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: all roasters declined org partnership (US-03-03).
 * Distinct from platform `org-rejected` (US-03-02 admin reject).
 */
export const ORG_DECLINED_SUBJECT =
  "Update on your Joe Perks organization application";

interface OrgDeclinedEmailProps {
  readonly contactName: string;
  readonly orgName: string;
}

export const OrgDeclinedEmail = ({
  orgName,
  contactName,
}: OrgDeclinedEmailProps) => (
  <BaseEmailLayout preview={`Update on ${orgName}'s application`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Unable to match a roaster partner
    </Text>
    <Text className="m-0 text-zinc-600">
      Hi {contactName}, thank you for applying on behalf of{" "}
      <strong>{orgName}</strong>.
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      Unfortunately, we were not able to confirm a roaster partnership for this
      application at this time. If you have questions or would like to explore
      other options, reply to this email or contact support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

OrgDeclinedEmail.PreviewProps = {
  orgName: "Lincoln High School Boosters",
  contactName: "Jamie Chen",
};

export default OrgDeclinedEmail;
