import { Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: roaster application not approved (US-02-02 reject action).
 *
 * ```ts
 * import { sendEmail } from "@joe-perks/email/send";
 * import { RoasterRejectedEmail } from "@joe-perks/email/templates/roaster-rejected";
 *
 * await sendEmail({
 *   template: "roaster-rejected",
 *   subject: ROASTER_REJECTED_SUBJECT,
 *   to: applicantEmail,
 *   entityType: "roaster_application",
 *   entityId: application.id,
 *   react: <RoasterRejectedEmail businessName={application.businessName} />,
 * });
 * ```
 */
export const ROASTER_REJECTED_SUBJECT = "Update on your roaster application";

interface RoasterRejectedEmailProps {
  readonly businessName: string;
}

export const RoasterRejectedEmail = ({
  businessName,
}: RoasterRejectedEmailProps) => (
  <BaseEmailLayout preview={`Update on your application for ${businessName}`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Update on your application
    </Text>
    <Text className="m-0 text-zinc-600">
      Thank you for your interest in Joe Perks and for applying with{" "}
      <strong>{businessName}</strong>. After careful review, we are not able to
      move forward with this application at this time.
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      We appreciate the time you spent with us, and we encourage you to consider
      applying again in the future as our partner needs evolve.
    </Text>
    <Text className="m-0 mt-6 text-sm text-zinc-500">
      If you would like more detail or believe we reached this decision in
      error, please contact us at support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

RoasterRejectedEmail.PreviewProps = {
  businessName: "North Star Roasting Co.",
};

export default RoasterRejectedEmail;
