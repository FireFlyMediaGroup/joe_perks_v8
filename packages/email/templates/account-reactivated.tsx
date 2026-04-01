import { Button, Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

export const ACCOUNT_REACTIVATED_SUBJECT =
  "Your Joe Perks account review is complete";

interface AccountReactivatedEmailProps {
  readonly accountName: string;
  readonly accountTypeLabel: string;
  readonly loginUrl: string;
  readonly nextStatusLabel: string;
}

export const AccountReactivatedEmail = ({
  accountName,
  accountTypeLabel,
  loginUrl,
  nextStatusLabel,
}: AccountReactivatedEmailProps) => (
  <BaseEmailLayout preview={`${accountName} can access Joe Perks again`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Account review complete
    </Text>
    <Text className="m-0 text-zinc-600">
      Your Joe Perks {accountTypeLabel} account for <strong>{accountName}</strong>{" "}
      has been reviewed and restored.
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      Current status: <strong>{nextStatusLabel}</strong>
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      If your status is onboarding, finish the remaining Stripe or setup steps in
      the portal before the account becomes fully active again.
    </Text>
    <Button
      className="mt-8 rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-sm text-white"
      href={loginUrl}
    >
      Go to portal
    </Button>
  </BaseEmailLayout>
);

AccountReactivatedEmail.PreviewProps = {
  accountName: "Lincoln High School Boosters",
  accountTypeLabel: "organization",
  loginUrl: "https://orgs.joeperks.com/dashboard",
  nextStatusLabel: "Active",
};

export default AccountReactivatedEmail;
