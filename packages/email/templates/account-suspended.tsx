import { Button, Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

export const ACCOUNT_SUSPENDED_SUBJECT = "Your Joe Perks account has been suspended";

interface AccountSuspendedEmailProps {
  readonly accountName: string;
  readonly accountTypeLabel: string;
  readonly loginUrl: string;
  readonly reasonLabel: string;
}

export const AccountSuspendedEmail = ({
  accountName,
  accountTypeLabel,
  loginUrl,
  reasonLabel,
}: AccountSuspendedEmailProps) => (
  <BaseEmailLayout preview={`${accountName} is temporarily suspended`}>
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Account temporarily suspended
    </Text>
    <Text className="m-0 text-zinc-600">
      Your Joe Perks {accountTypeLabel} account for <strong>{accountName}</strong>{" "}
      is temporarily suspended while our team reviews the account.
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      Reason category: <strong>{reasonLabel}</strong>
    </Text>
    <Text className="m-0 mt-4 text-zinc-600">
      Existing confirmed orders will continue, but new activity tied to this
      account is blocked until the review is resolved.
    </Text>
    <Button
      className="mt-8 rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-sm text-white"
      href={loginUrl}
    >
      View account status
    </Button>
    <Text className="m-0 mt-6 text-sm text-zinc-500">
      Sign in to review the status details and submit a reactivation request once
      you&apos;ve addressed the issue.
    </Text>
  </BaseEmailLayout>
);

AccountSuspendedEmail.PreviewProps = {
  accountName: "North Star Roasting Co.",
  accountTypeLabel: "roaster",
  loginUrl: "https://roasters.joeperks.com/dashboard",
  reasonLabel: "Dispute risk review",
};

export default AccountSuspendedEmail;
