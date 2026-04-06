import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Hr,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { BaseEmailLayout } from "./base-layout";

export function SlaRoasterReminderEmail(props: {
  orderNumber: string;
  fulfillByIso: string;
  fulfillUrl: string;
}) {
  return (
    <BaseEmailLayout
      preview={`Reminder: order ${props.orderNumber} needs fulfillment`}
    >
      <Text className="mt-0 mb-4 font-semibold text-2xl text-zinc-950">
        Fulfillment reminder
      </Text>
      <Text className="m-0 text-zinc-600">
        Order #{props.orderNumber} still needs tracking. Please ship it by{" "}
        {props.fulfillByIso} to stay within Joe Perks fulfillment standards.
      </Text>

      <Hr className="my-6" />

      <Button
        className="rounded-md bg-zinc-900 px-5 py-3 text-center font-semibold text-[15px] text-white no-underline"
        href={props.fulfillUrl}
      >
        Open fulfillment page
      </Button>

      <Text className="mt-4 mb-0 text-sm text-zinc-500">
        If the button does not open, use this secure link:{" "}
        <Link className="text-zinc-900 underline" href={props.fulfillUrl}>
          {props.fulfillUrl}
        </Link>
      </Text>
    </BaseEmailLayout>
  );
}

export function SlaRoasterUrgentEmail(props: {
  orderNumber: string;
  fulfillByIso: string;
  fulfillUrl: string;
}) {
  return (
    <BaseEmailLayout preview={`Urgent: SLA breach — order ${props.orderNumber}`}>
      <Text className="mt-0 mb-4 font-semibold text-2xl text-red-800">
        SLA breach
      </Text>
      <Text className="m-0 text-zinc-600">
        Order #{props.orderNumber} passed its fulfillment deadline at{" "}
        {props.fulfillByIso}. Please open the fulfillment page now to add
        tracking as soon as the shipment is on the way.
      </Text>
      <Text className="mt-4 mb-0 text-zinc-600">
        If you cannot ship the order, contact Joe Perks support right away so we
        can help before the order reaches refund risk.
      </Text>

      <Hr className="my-6" />

      <Button
        className="rounded-md bg-red-700 px-5 py-3 text-center font-semibold text-[15px] text-white no-underline"
        href={props.fulfillUrl}
      >
        Fulfill this order now
      </Button>

      <Text className="mt-4 mb-0 text-sm text-zinc-500">
        Direct link:{" "}
        <Link className="text-zinc-900 underline" href={props.fulfillUrl}>
          {props.fulfillUrl}
        </Link>
      </Text>
    </BaseEmailLayout>
  );
}

export function SlaBuyerDelayEmail(props: { orderNumber: string }) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Update on order {props.orderNumber}</Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-12">
            <Section className="rounded-md bg-white p-8 shadow-sm">
              <Text className="mt-0 font-semibold text-xl text-zinc-950">
                Shipping delay
              </Text>
              <Text className="text-zinc-600">
                We apologize for the delay — order {props.orderNumber} is taking
                longer than expected to ship. We are working with the roaster to
                get it out soon.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export function SlaAdminAlertEmail(props: {
  orderNumber: string;
  orderId: string;
  stage: "breach" | "critical";
  thresholdHours: number;
}) {
  const title =
    props.stage === "breach"
      ? `SLA breach (${props.thresholdHours}h tier)`
      : `SLA critical (${props.thresholdHours}h tier)`;
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          {title}: {props.orderNumber}
        </Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-12">
            <Section className="rounded-md bg-white p-8 shadow-sm">
              <Text className="mt-0 font-semibold text-xl text-zinc-950">
                {title}
              </Text>
              <Text className="text-zinc-600">
                Order {props.orderNumber} ({props.orderId}) requires platform
                attention.
                {props.stage === "breach"
                  ? " Escalate with the roaster and confirm a ship date."
                  : " Coordinate manual follow-up — auto-refund may apply if the order remains unshipped."}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export function OrderFlaggedAdminAlertEmail(props: {
  orderNumber: string;
  orderId: string;
  reason: string;
  resolutionOffered: string;
  note?: string | null;
}) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Fulfillment issue reported: {props.orderNumber}</Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-12">
            <Section className="rounded-md bg-white p-8 shadow-sm">
              <Text className="mt-0 font-semibold text-xl text-zinc-950">
                Fulfillment issue reported
              </Text>
              <Text className="text-zinc-600">
                Order {props.orderNumber} ({props.orderId}) was flagged by the
                roaster and now needs admin follow-up.
              </Text>
              <Text className="text-zinc-600">
                Reason: {props.reason}
                <br />
                Requested support: {props.resolutionOffered}
              </Text>
              {props.note ? (
                <Text className="text-zinc-600">Roaster note: {props.note}</Text>
              ) : null}
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
