import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface BaseEmailLayoutProps {
  readonly children: ReactNode;
  readonly preview: string;
}

export const BaseEmailLayout = ({
  children,
  preview,
}: BaseEmailLayoutProps) => (
  <Tailwind>
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body className="bg-zinc-50 font-sans">
        <Container className="mx-auto py-12">
          <Section className="mb-6 text-center">
            <Text className="m-0 font-bold text-xl text-zinc-900">
              Joe Perks
            </Text>
            <Text className="m-0 text-xs text-zinc-500">
              Coffee that funds your cause
            </Text>
          </Section>

          <Section className="mt-4 rounded-md bg-zinc-200 p-px">
            <Section className="rounded-[5px] bg-white p-8">{children}</Section>
          </Section>

          <Hr className="my-8 border-zinc-200" />
          <Text className="m-0 text-center text-xs text-zinc-400">
            © {new Date().getFullYear()} Joe Perks. All rights reserved.
          </Text>
          <Text className="m-0 text-center text-xs text-zinc-400">
            Questions? Contact us at support@joeperks.com
          </Text>
        </Container>
      </Body>
    </Html>
  </Tailwind>
);

export default BaseEmailLayout;
