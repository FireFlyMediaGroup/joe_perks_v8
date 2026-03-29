import { Button, Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

/**
 * Transactional email: roaster application approved (US-02-02 approve action).
 *
 * ```ts
 * import { sendEmail } from "@joe-perks/email/send";
 * import { RoasterApprovedEmail } from "@joe-perks/email/templates/roaster-approved";
 *
 * await sendEmail({
 *   template: "roaster-approved",
 *   subject: ROASTER_APPROVED_SUBJECT,
 *   to: applicantEmail,
 *   entityType: "roaster_application",
 *   entityId: application.id,
 *   react: (
 *     <RoasterApprovedEmail
 *       businessName={application.businessName}
 *       loginUrl={roasterPortalSignInUrl}
 *     />
 *   ),
 * });
 * ```
 */
export const ROASTER_APPROVED_SUBJECT =
  "Your roaster application has been approved!";

interface RoasterApprovedEmailProps {
  readonly businessName: string;
  readonly loginUrl: string;
}

const nextSteps = [
  "Complete your Stripe Express account setup to receive payouts",
  "Add your coffee products with wholesale and retail pricing",
  "Configure your shipping rates",
] as const;

export const RoasterApprovedEmail = ({
  businessName,
  loginUrl,
}: RoasterApprovedEmailProps) => (
  <BaseEmailLayout preview={`You're approved — welcome, ${businessName}`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Welcome to Joe Perks
    </Text>
    <Text className="m-0 text-zinc-600">
      Great news — <strong>{businessName}</strong> is approved to join Joe Perks
      as a roaster partner. Sign in to the roaster portal to finish setup and
      start receiving campaign orders.
    </Text>
    <Text className="mt-6 mb-2 font-semibold text-sm text-zinc-900">
      Next steps
    </Text>
    {nextSteps.map((step, i) => (
      <Text className="my-1 text-sm text-zinc-600" key={step}>
        {i + 1}. {step}
      </Text>
    ))}
    <Button
      className="mt-8 rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-sm text-white"
      href={loginUrl}
    >
      Go to roaster portal
    </Button>
    <Text className="m-0 mt-6 text-sm text-zinc-500">
      If you have questions, reply to this email or contact
      support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

RoasterApprovedEmail.PreviewProps = {
  businessName: "North Star Roasting Co.",
  loginUrl: "https://roasters.joeperks.com/sign-in",
};

export default RoasterApprovedEmail;
