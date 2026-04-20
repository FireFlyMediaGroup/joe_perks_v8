import { Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: roaster application received (US-02-01).
 *
 * Wire with `sendEmail()` from `@joe-perks/email/send` after `RoasterApplication` is created:
 *
 * ```ts
 * import { sendEmail } from "@joe-perks/email/send";
 * import { RoasterApplicationReceivedEmail } from "@joe-perks/email/templates/roaster-application-received";
 *
 * await sendEmail({
 *   template: "roaster-application-received",
 *   subject: ROASTER_APPLICATION_RECEIVED_SUBJECT,
 *   to: applicantEmail,
 *   entityType: "roaster_application",
 *   entityId: application.id,
 *   react: (
 *     <RoasterApplicationReceivedEmail
 *       businessName={application.businessName}
 *       email={application.email}
 *     />
 *   ),
 * });
 * ```
 */
export const ROASTER_APPLICATION_RECEIVED_SUBJECT =
  "We received your roaster application";

interface RoasterApplicationReceivedEmailProps {
  readonly businessName: string;
  readonly email: string;
}

export const RoasterApplicationReceivedEmail = ({
  businessName,
  email,
}: RoasterApplicationReceivedEmailProps) => (
  <BaseEmailLayout preview={`We received your application for ${businessName}`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Thanks for applying
    </Text>
    <Text className="m-0 text-zinc-600">
      Hi there — we received your roaster application for{" "}
      <strong>{businessName}</strong>. We will review it and get back to you
      within <strong>2–3 business days</strong>.
    </Text>
    <Text className="m-0 mt-4 text-sm text-zinc-600">
      We sent this message to <strong>{email}</strong>. If that is not correct,
      reply to this email and we will help.
    </Text>
    <Text className="m-0 mt-6 text-sm text-zinc-500">
      Questions? Contact us at support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

RoasterApplicationReceivedEmail.PreviewProps = {
  businessName: "North Star Roasting Co.",
  email: "applicant@example.com",
};

export default RoasterApplicationReceivedEmail;
