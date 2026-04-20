import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Roaster Terms of Service",
  description: "Terms of service for roasters on the Joe Perks platform.",
});

const RoasterTermsPage = () => (
  <div className="container max-w-3xl py-16">
    <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-6 py-4 dark:border-amber-700 dark:bg-amber-950">
      <p className="font-semibold text-amber-800 text-sm dark:text-amber-200">
        PENDING LEGAL REVIEW — This document is a placeholder and has not been
        reviewed by legal counsel. Do not rely on it as a binding agreement.
      </p>
    </div>

    <h1 className="mb-4 font-extrabold text-4xl tracking-tight">
      Roaster Terms of Service
    </h1>
    <p className="mb-8 text-muted-foreground">
      Last updated: <time dateTime="2026-03-28">March 28, 2026</time>
    </p>

    <div className="prose prose-neutral dark:prose-invert">
      <h2>1. Overview</h2>
      <p>
        These Terms of Service ("Terms") govern your use of the Joe Perks
        platform as a coffee roaster partner ("Roaster"). By creating an
        account, you agree to be bound by these Terms.
      </p>

      <h2>2. Account &amp; Onboarding</h2>
      <p>
        Roasters must complete the onboarding process, including Stripe Connect
        Express account setup, before listing products. Joe Perks reserves the
        right to approve or reject any roaster application.
      </p>

      <h2>3. Products &amp; Pricing</h2>
      <p>
        Roasters set their own wholesale and suggested retail prices. All prices
        are stored in US cents. Roasters are responsible for the accuracy of
        product descriptions, images, and inventory availability.
      </p>

      <h2>4. Orders &amp; Fulfillment</h2>
      <p>
        Roasters agree to fulfill orders within the SLA window defined by
        platform settings (default: 24 hours warning, 48 hours breach). Failure
        to meet SLA thresholds may result in automatic refunds and account
        review.
      </p>

      <h2>5. Revenue Split</h2>
      <p>
        Revenue is split on every order: the organization receives its
        fundraiser percentage (5–25%), the platform retains a fee (5%, minimum
        $1.00), and the roaster receives the remainder. Shipping costs are
        passed through to the roaster and excluded from split calculations.
      </p>

      <h2>6. Payouts</h2>
      <p>
        Payouts are processed via Stripe after a configurable hold period.
        Roasters must maintain an active Stripe Express account in good standing
        to receive payouts.
      </p>

      <h2>7. Termination</h2>
      <p>
        Either party may terminate the relationship with 30 days written notice.
        Joe Perks may immediately suspend roaster accounts for policy
        violations.
      </p>
    </div>
  </div>
);

export default RoasterTermsPage;
