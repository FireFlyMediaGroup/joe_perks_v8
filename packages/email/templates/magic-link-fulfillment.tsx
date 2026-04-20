import { Button, Hr, Text } from "@react-email/components";

import { BaseEmailLayout } from "./base-layout";

interface MagicLinkFulfillmentEmailProps {
  readonly fulfillUrl: string;
  readonly items: Array<{
    name: string;
    quantity: number;
    priceInCents: number;
  }>;
  readonly orderNumber: string;
  readonly shippingInCents: number;
  readonly totalInCents: number;
}

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function MagicLinkFulfillmentEmail({
  fulfillUrl,
  items,
  orderNumber,
  shippingInCents,
  totalInCents,
}: MagicLinkFulfillmentEmailProps) {
  const subtotalInCents = items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );

  return (
    <BaseEmailLayout preview={`New order ${orderNumber} — action needed`}>
      <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
        New order for fulfillment
      </Text>
      <Text className="m-0 text-zinc-600">
        You have a new Joe Perks order. Open the link below to view details and
        add tracking when you ship.
      </Text>

      <Hr className="my-4" />

      <Text className="mb-2 font-semibold text-sm text-zinc-900">
        Order #{orderNumber}
      </Text>

      {items.map((item) => (
        <Text
          className="my-1 text-sm text-zinc-600"
          key={`${item.name}-${item.quantity}`}
        >
          {item.name} × {item.quantity} <span className="text-zinc-400">—</span>{" "}
          {formatCents(item.priceInCents * item.quantity)}
        </Text>
      ))}

      <Hr className="my-4" />

      <Text className="my-1 text-sm text-zinc-600">
        Subtotal: {formatCents(subtotalInCents)}
      </Text>
      <Text className="my-1 text-sm text-zinc-600">
        Shipping (pass-through): {formatCents(shippingInCents)}
      </Text>
      <Text className="my-1 font-semibold text-sm text-zinc-900">
        Total charged: {formatCents(totalInCents)}
      </Text>

      <Hr className="my-6" />

      <Button
        className="rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-[15px] text-white no-underline"
        href={fulfillUrl}
      >
        View order &amp; ship
      </Button>

      <Hr className="my-6" />

      <Text className="m-0 text-sm text-zinc-500">
        This secure link expires in 72 hours. If it expires, contact Joe Perks
        support for a new link.
      </Text>
    </BaseEmailLayout>
  );
}

MagicLinkFulfillmentEmail.PreviewProps = {
  orderNumber: "JP-00042",
  fulfillUrl: "http://localhost:3001/fulfill/abc123deadbeef",
  items: [
    {
      name: "Ethiopian Yirgacheffe 12oz Whole Bean",
      quantity: 2,
      priceInCents: 1999,
    },
  ],
  shippingInCents: 895,
  totalInCents: 4893,
};

export default MagicLinkFulfillmentEmail;
