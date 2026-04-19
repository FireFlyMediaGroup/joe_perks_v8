import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Organization Terms of Service",
  description: "Terms of service for organizations on the Joe Perks platform.",
});

const OrgTermsPage = () => (
  <div className="container max-w-3xl py-16">
    <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-6 py-4 dark:border-amber-700 dark:bg-amber-950">
      <p className="font-semibold text-amber-800 text-sm dark:text-amber-200">
        PENDING LEGAL REVIEW — This document is a placeholder and has not been
        reviewed by legal counsel. Do not rely on it as a binding agreement.
      </p>
    </div>

    <h1 className="mb-4 font-extrabold text-4xl tracking-tight">
      Organization Terms of Service
    </h1>
    <p className="mb-8 text-muted-foreground">
      Last updated: <time dateTime="2026-03-28">March 28, 2026</time>
    </p>

    <div className="prose prose-neutral dark:prose-invert">
      <h2>1. Overview</h2>
      <p>
        These Terms of Service ("Terms") govern your use of the Joe Perks
        platform as a fundraising organization ("Organization"). By creating an
        account, you agree to be bound by these Terms.
      </p>

      <h2>2. Account &amp; Onboarding</h2>
      <p>
        Organizations must complete the onboarding process, including selecting
        a roaster partner and setting up a Stripe Express account for receiving
        fundraiser earnings. Joe Perks reserves the right to approve or reject
        any organization application.
      </p>

      <h2>3. Campaigns</h2>
      <p>
        Organizations create fundraising campaigns with a unique storefront
        slug. Campaigns include a curated selection of products from an approved
        roaster partner. Campaign start and end dates are managed by the
        organization.
      </p>

      <h2>4. Revenue Split</h2>
      <p>
        Organizations receive a fundraiser percentage (5–25% of product
        subtotal) on every order placed through their campaign storefront. The
        exact percentage is agreed upon during onboarding and frozen at the time
        of each order.
      </p>

      <h2>5. Payouts</h2>
      <p>
        Organization payouts are processed via Stripe after a configurable hold
        period. Organizations must maintain an active Stripe Express account in
        good standing to receive payouts.
      </p>

      <h2>6. Storefront &amp; Branding</h2>
      <p>
        Organizations may customize their storefront with a logo, hero image,
        and description. All content must comply with Joe Perks content
        guidelines. Offensive or misleading content will be removed.
      </p>

      <h2>7. Termination</h2>
      <p>
        Either party may terminate the relationship with 30 days written notice.
        Active campaigns will be honored through their end date. Joe Perks may
        immediately suspend organization accounts for policy violations.
      </p>
    </div>
  </div>
);

export default OrgTermsPage;
