import { Button, Hr, Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

export const BUYER_AUTH_MAGIC_LINK_SUBJECT =
  "Your Joe Perks sign-in link";

interface BuyerAuthMagicLinkEmailProps {
  readonly authUrl: string;
  readonly buyerName?: string | null;
  readonly expiresInMinutes: number;
}

export const BuyerAuthMagicLinkEmail = ({
  authUrl,
  buyerName,
  expiresInMinutes,
}: BuyerAuthMagicLinkEmailProps) => (
  <BaseEmailLayout preview="Sign in to view your Joe Perks orders">
    <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
      Sign in to your buyer account
    </Text>
    <Text className="m-0 text-zinc-600">
      {buyerName ? `Hi ${buyerName}, ` : ""}
      use this secure link to view your orders, check tracking, and get back to
      checkout faster next time.
    </Text>

    <Hr className="my-6" />

    <Button
      className="rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-[15px] text-white no-underline"
      href={authUrl}
    >
      Sign in to Joe Perks
    </Button>

    <Hr className="my-6" />

    <Text className="m-0 text-sm text-zinc-500">
      This secure link expires in {expiresInMinutes} minutes. If you did not
      request it, you can safely ignore this email.
    </Text>
  </BaseEmailLayout>
);

BuyerAuthMagicLinkEmail.PreviewProps = {
  authUrl: "http://localhost:3000/en/account/auth/abc123?redirect=%2Fen%2Faccount",
  buyerName: "Pat Buyer",
  expiresInMinutes: 15,
};

export default BuyerAuthMagicLinkEmail;
