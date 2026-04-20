import { Hr, Link, Text } from "@react-email/components";

import { BaseEmailLayout } from "./base-layout";

interface OrderShippedEmailProps {
  readonly buyerName: string;
  readonly carrier: string;
  readonly orderNumber: string;
  readonly orgName: string;
  readonly trackingNumber: string;
}

function trackingUrl(carrier: string, trackingNumber: string): string | null {
  const c = carrier.toUpperCase();
  const enc = encodeURIComponent(trackingNumber);
  if (c.includes("USPS")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${enc}`;
  }
  if (c.includes("UPS")) {
    return `https://www.ups.com/track?tracknum=${enc}`;
  }
  if (c.includes("FEDEX") || c === "FEDEX") {
    return `https://www.fedex.com/fedextrack/?trknbr=${enc}`;
  }
  if (c.includes("DHL")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${enc}`;
  }
  return null;
}

function OrderShippedEmail({
  buyerName,
  carrier,
  orderNumber,
  orgName,
  trackingNumber,
}: OrderShippedEmailProps) {
  const url = trackingUrl(carrier, trackingNumber);

  return (
    <BaseEmailLayout preview={`Your order ${orderNumber} has shipped`}>
      <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
        Your order has shipped!
      </Text>
      <Text className="m-0 text-zinc-600">
        Hi {buyerName}, great news — order #{orderNumber} is on its way.
      </Text>

      <Hr className="my-4" />

      <Text className="my-1 text-sm text-zinc-700">
        <span className="font-semibold text-zinc-900">Carrier:</span> {carrier}
      </Text>
      <Text className="my-1 text-sm text-zinc-700">
        <span className="font-semibold text-zinc-900">Tracking:</span>{" "}
        {url ? (
          <Link className="text-zinc-900 underline" href={url}>
            {trackingNumber}
          </Link>
        ) : (
          trackingNumber
        )}
      </Text>

      <Hr className="my-4" />

      <Text className="m-0 text-sm text-zinc-600">
        Thank you for supporting {orgName}. Every bag helps your community reach
        its goal.
      </Text>
    </BaseEmailLayout>
  );
}

OrderShippedEmail.PreviewProps = {
  buyerName: "Jane",
  orderNumber: "JP-00042",
  trackingNumber: "9405511899562860000000",
  carrier: "USPS",
  orgName: "Lincoln Elementary PTA",
};

export default OrderShippedEmail;
