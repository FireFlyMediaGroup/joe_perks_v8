import { createMetadata } from "@repo/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description: "Joe Perks privacy policy.",
});

const PrivacyPolicyPage = () => (
  <div className="container max-w-3xl py-16">
    <div className="mb-8 rounded-md border border-amber-300 bg-amber-50 px-6 py-4 dark:border-amber-700 dark:bg-amber-950">
      <p className="font-semibold text-amber-800 text-sm dark:text-amber-200">
        PENDING LEGAL REVIEW — This document is a placeholder and has not been
        reviewed by legal counsel. Do not rely on it as a binding agreement.
      </p>
    </div>

    <h1 className="mb-4 font-extrabold text-4xl tracking-tight">
      Privacy Policy
    </h1>
    <p className="mb-8 text-muted-foreground">
      Last updated: <time dateTime="2026-03-28">March 28, 2026</time>
    </p>

    <div className="prose prose-neutral dark:prose-invert">
      <h2>1. Information We Collect</h2>
      <p>
        Joe Perks collects information necessary to process orders and manage
        accounts, including: name, email address, shipping address, and payment
        information (processed securely via Stripe).
      </p>

      <h2>2. How We Use Your Information</h2>
      <p>
        We use collected information to: process and fulfill orders, communicate
        order status and shipping updates, manage roaster and organization
        accounts, improve our platform, and comply with legal obligations.
      </p>

      <h2>3. Information Sharing</h2>
      <p>
        We share buyer shipping information with roasters solely for order
        fulfillment. We share aggregated, non-identifying campaign data with
        organizations. We do not sell personal information to third parties.
      </p>

      <h2>4. Payment Processing</h2>
      <p>
        All payment processing is handled by Stripe. Joe Perks does not store
        credit card numbers or full payment details on our servers. Please
        review{" "}
        <a
          href="https://stripe.com/privacy"
          rel="noopener noreferrer"
          target="_blank"
        >
          Stripe's Privacy Policy
        </a>{" "}
        for details on how payment data is handled.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain order and account data as required for business operations and
        legal compliance. Buyer accounts may request deletion of personal data
        by contacting support. Product and order records use soft deletes for
        audit purposes.
      </p>

      <h2>6. Analytics</h2>
      <p>
        We use PostHog for product analytics with autocapture and session
        recording disabled. We use Sentry for error monitoring with PII
        scrubbing enabled to prevent accidental capture of personal data.
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use essential cookies for authentication sessions (Clerk) and
        analytics (PostHog). No third-party advertising cookies are used.
      </p>

      <h2>8. Contact</h2>
      <p>
        For privacy-related questions, contact us at{" "}
        <a href="mailto:support@joeperks.com">support@joeperks.com</a>.
      </p>
    </div>
  </div>
);

export default PrivacyPolicyPage;
