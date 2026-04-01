import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export function SlaRoasterReminderEmail(props: {
  orderNumber: string;
  fulfillByIso: string;
}) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Reminder: order {props.orderNumber} needs fulfillment</Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-12">
            <Section className="rounded-md bg-white p-8 shadow-sm">
              <Text className="mt-0 font-semibold text-xl text-zinc-950">
                Fulfillment reminder
              </Text>
              <Text className="text-zinc-600">
                Please ship order {props.orderNumber} by {props.fulfillByIso} to
                stay within Joe Perks fulfillment standards.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export function SlaRoasterUrgentEmail(props: {
  orderNumber: string;
  fulfillByIso: string;
}) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>Urgent: SLA breach — order {props.orderNumber}</Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-12">
            <Section className="rounded-md bg-white p-8 shadow-sm">
              <Text className="mt-0 font-semibold text-red-800 text-xl">
                SLA breach
              </Text>
              <Text className="text-zinc-600">
                Order {props.orderNumber} has passed the fulfillment deadline (
                {props.fulfillByIso}). Ship immediately or contact support.
                Continued delays may affect your standing on the marketplace.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
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
