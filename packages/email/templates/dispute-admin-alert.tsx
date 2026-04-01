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

export function DisputeAdminAlertEmail(props: {
  disputeCount90d: number;
  orderNumber: string;
  roasterId: string;
  stripeDisputeId: string;
}) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>
          Auto-suspended after disputes: order {props.orderNumber}
        </Preview>
        <Body className="bg-zinc-50 font-sans">
          <Container className="mx-auto py-12">
            <Section className="rounded-md bg-white p-8 shadow-sm">
              <Text className="mt-0 font-semibold text-xl text-zinc-950">
                Roaster auto-suspended after chargeback loss
              </Text>
              <Text className="text-zinc-600">
                Order {props.orderNumber} closed as a roaster-fault dispute.
                The roaster has now reached {props.disputeCount90d} lost
                roaster-fault disputes in the trailing 90-day window and was
                automatically moved to `SUSPENDED`.
              </Text>
              <Text className="text-zinc-600">
                Roaster ID: {props.roasterId}
                <br />
                Stripe dispute ID: {props.stripeDisputeId}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default DisputeAdminAlertEmail;
