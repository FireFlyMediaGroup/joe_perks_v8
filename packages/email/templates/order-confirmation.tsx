import { Hr, Text } from "@react-email/components";
import { BaseEmailLayout } from "./base-layout";

interface OrderItem {
  name: string;
  quantity: number;
  priceInCents: number;
}

interface OrderConfirmationEmailProps {
  readonly buyerName: string;
  readonly items: OrderItem[];
  readonly orderNumber: string;
  readonly orgName: string;
  readonly shippingInCents: number;
  readonly totalInCents: number;
}

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const OrderConfirmationEmail = ({
  buyerName,
  items,
  orderNumber,
  orgName,
  shippingInCents,
  totalInCents,
}: OrderConfirmationEmailProps) => {
  const subtotalInCents = items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0
  );

  return (
    <BaseEmailLayout preview={`Order ${orderNumber} confirmed`}>
      <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
        Order Confirmed
      </Text>
      <Text className="m-0 text-zinc-600">
        Thank you, {buyerName}! Your order has been placed and the roaster has
        been notified. A portion of your purchase supports {orgName}.
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
          {item.name} × {item.quantity}{" "}
          <span className="text-zinc-400">—</span>{" "}
          {formatCents(item.priceInCents * item.quantity)}
        </Text>
      ))}

      <Hr className="my-4" />

      <Text className="my-1 text-sm text-zinc-600">
        Subtotal: {formatCents(subtotalInCents)}
      </Text>
      <Text className="my-1 text-sm text-zinc-600">
        Shipping: {formatCents(shippingInCents)}
      </Text>
      <Text className="my-1 font-semibold text-sm text-zinc-900">
        Total: {formatCents(totalInCents)}
      </Text>

      <Hr className="my-4" />

      <Text className="m-0 text-sm text-zinc-500">
        You will receive a shipping confirmation email with tracking information
        once the roaster ships your order.
      </Text>
    </BaseEmailLayout>
  );
};

OrderConfirmationEmail.PreviewProps = {
  buyerName: "Jane Smith",
  orderNumber: "JP-00042",
  orgName: "Lincoln Elementary PTA",
  items: [
    { name: "Ethiopian Yirgacheffe (12oz)", quantity: 2, priceInCents: 1899 },
    { name: "Colombian Supremo (12oz)", quantity: 1, priceInCents: 1599 },
  ],
  shippingInCents: 599,
  totalInCents: 4996,
};

export default OrderConfirmationEmail;
