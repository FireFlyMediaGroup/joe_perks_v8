import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { ComingSoonPage } from "@/app/_components/coming-soon-page";

export const metadata: Metadata = createMetadata({
  title: "Organization Terms of Service",
  description: "Terms of service for organizations on the Joe Perks platform.",
});

const OrgTermsPage = () => (
  <ComingSoonPage title="Organization Terms of Service" />
);

export default OrgTermsPage;
