import { Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

interface WelcomeEmailProps {
  readonly name: string;
  readonly role: "roaster" | "org";
}

const roleLabels = {
  roaster: "Roaster Partner",
  org: "Organization Partner",
} as const;

const roleDescriptions = {
  roaster:
    "You can now set up your products, configure shipping rates, and start receiving orders from organization campaigns.",
  org: "You can now create fundraising campaigns, select coffee products, and share your storefront link to start raising funds.",
} as const;

const nextSteps = {
  roaster: [
    "Complete your Stripe Express account setup to receive payouts",
    "Add your coffee products with descriptions and pricing",
    "Configure your shipping rates",
    "Wait for organization partner requests to start fulfilling orders",
  ],
  org: [
    "Complete your Stripe Express account setup to receive earnings",
    "Choose a roaster partner for your campaign",
    "Customize your storefront with your logo and message",
    "Share your campaign link with supporters",
  ],
} as const;

export const WelcomeEmail = ({ name, role }: WelcomeEmailProps) => (
  <BaseEmailLayout preview={`Welcome to Joe Perks, ${name}!`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Welcome to Joe Perks!
    </Text>
    <Text className="m-0 text-zinc-600">
      Hi {name}, your account has been approved as a{" "}
      <strong>{roleLabels[role]}</strong> on Joe Perks.{" "}
      {roleDescriptions[role]}
    </Text>

    <Text className="mt-6 mb-2 font-semibold text-sm text-zinc-900">
      Next steps:
    </Text>
    {nextSteps[role].map((step, i) => (
      <Text className="my-1 text-sm text-zinc-600" key={step}>
        {i + 1}. {step}
      </Text>
    ))}

    <Text className="mt-6 text-sm text-zinc-500">
      If you have any questions, reply to this email or contact us at
      support@joeperks.com.
    </Text>
  </BaseEmailLayout>
);

WelcomeEmail.PreviewProps = {
  name: "Sarah Johnson",
  role: "org" as const,
};

export default WelcomeEmail;
