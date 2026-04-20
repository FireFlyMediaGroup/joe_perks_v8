import { Hr, Text } from "@react-email/components";

import { BaseEmailLayout } from "./base-layout";

interface OrderDeliveredEmailProps {
  readonly buyerName: string;
  readonly orderNumber: string;
  readonly orgAmountInCents: number;
  readonly orgName: string;
  readonly orgPctSnapshot: number;
}

function OrderDeliveredEmail({
  buyerName,
  orderNumber,
  orgAmountInCents,
  orgName,
  orgPctSnapshot,
}: OrderDeliveredEmailProps) {
  const orgDollars = (orgAmountInCents / 100).toFixed(2);
  const pct = Math.round(orgPctSnapshot * 1000) / 10;

  return (
    <BaseEmailLayout preview={`Delivered — order ${orderNumber}`}>
      <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
        Your order has been delivered!
      </Text>
      <Text className="m-0 text-zinc-600">
        Hi {buyerName}, we&apos;re happy to confirm order #{orderNumber} has
        been marked delivered. Thank you for choosing Joe Perks.
      </Text>

      <Hr className="my-4" />

      <Text className="m-0 text-sm text-zinc-700 leading-6">
        Thanks to your purchase,{" "}
        <span className="font-semibold text-zinc-900">${orgDollars}</span> (
        {pct}% of product total) goes directly to{" "}
        <span className="font-semibold text-zinc-900">{orgName}</span>. Every
        cup helps your community fundraiser.
      </Text>

      <Hr className="my-4" />

      <Text className="m-0 text-sm text-zinc-600">
        We appreciate you making a difference with your morning brew.
      </Text>
    </BaseEmailLayout>
  );
}

OrderDeliveredEmail.PreviewProps = {
  buyerName: "Jane",
  orderNumber: "JP-00042",
  orgName: "Lincoln Elementary PTA",
  orgAmountInCents: 450,
  orgPctSnapshot: 0.15,
};

export default OrderDeliveredEmail;
