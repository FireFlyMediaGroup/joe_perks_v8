import { Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: platform rejected org application (US-03-02 reject action).
 */
export const ORG_REJECTED_SUBJECT =
  "Update on your Joe Perks organization application";

interface OrgRejectedEmailProps {
  readonly orgName: string;
  readonly contactName: string;
}

export const OrgRejectedEmail = ({
  orgName,
  contactName,
}: OrgRejectedEmailProps) => (
  <BaseEmailLayout preview={`Update on ${orgName}'s application`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Application not approved
    </Text>
    <Text className="m-0 text-zinc-600">
      Hi {contactName}, thank you for your interest in Joe Perks and for
      applying on behalf of <strong>{orgName}</strong>.
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      After review, we are unable to move forward with this application at
      this time. If you believe this is a mistake or you have questions, please
      reply to this email or contact support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

OrgRejectedEmail.PreviewProps = {
  orgName: "Lincoln High School Boosters",
  contactName: "Jamie Chen",
};

export default OrgRejectedEmail;
