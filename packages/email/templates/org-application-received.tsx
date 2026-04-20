import { Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: organization application received (US-03-01).
 *
 * ```ts
 * import { sendEmail } from "@joe-perks/email/send";
 * import { OrgApplicationReceivedEmail } from "@joe-perks/email/templates/org-application-received";
 *
 * await sendEmail({
 *   template: "org-application-received",
 *   subject: ORG_APPLICATION_RECEIVED_SUBJECT,
 *   to: applicantEmail,
 *   entityType: "org_application",
 *   entityId: application.id,
 *   react: (
 *     <OrgApplicationReceivedEmail
 *       orgName={orgNameFromForm}
 *       contactName={contactName}
 *     />
 *   ),
 * });
 * ```
 */
export const ORG_APPLICATION_RECEIVED_SUBJECT =
  "We received your organization application";

interface OrgApplicationReceivedEmailProps {
  readonly contactName: string;
  readonly orgName: string;
}

export const OrgApplicationReceivedEmail = ({
  orgName,
  contactName,
}: OrgApplicationReceivedEmailProps) => (
  <BaseEmailLayout preview={`We received ${orgName}'s application`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Application received
    </Text>
    <Text className="m-0 text-zinc-600">
      Hi {contactName}, thank you for submitting an application for{" "}
      <strong>{orgName}</strong> on Joe Perks. We have everything we need to
      start review.
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      <strong>What happens next:</strong> our team reviews your application
      (typically within a few business days). After approval, you will choose
      roaster partners and we will coordinate next steps for your fundraising
      storefront.
    </Text>
    <Text className="m-0 mt-4 text-sm text-zinc-600">
      We will email you at this address with updates. Questions in the meantime?
      Reach us at support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

OrgApplicationReceivedEmail.PreviewProps = {
  orgName: "Lincoln Elementary PTA",
  contactName: "Jordan Lee",
};

export default OrgApplicationReceivedEmail;
