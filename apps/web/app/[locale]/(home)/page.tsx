import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";
import { AudienceSection } from "./components/audience-section";
import { BenefitsSection } from "./components/benefits-section";
import { CtaBanner } from "./components/cta-banner";
import { Features } from "./components/features";
import { Hero } from "./components/hero";
import { HowItWorks } from "./components/how-it-works";
import { ScrollReveal } from "./components/scroll-reveal";
import { Testimonials } from "./components/testimonials";

export const metadata: Metadata = createMetadata({
  title: "Joe Perks — Coffee Fundraising That Works",
  description:
    "Connect specialty coffee roasters with schools, sports teams, and nonprofits. Every bag sold funds what matters — automatically.",
});

const Home = () => (
  <>
    <ScrollReveal />
    <Hero />
    <HowItWorks />
    <Features />
    <AudienceSection />
    <BenefitsSection />
    <Testimonials />
    <CtaBanner />
  </>
);

export default Home;
