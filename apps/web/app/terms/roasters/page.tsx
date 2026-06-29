import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { ComingSoonPage } from "@/app/_components/coming-soon-page";

export const metadata: Metadata = createMetadata({
  title: "Roaster Terms of Service",
  description: "Terms of service for roasters on the Joe Perks platform.",
});

const RoasterTermsPage = () => (
  <ComingSoonPage title="Roaster Terms of Service" />
);

export default RoasterTermsPage;
