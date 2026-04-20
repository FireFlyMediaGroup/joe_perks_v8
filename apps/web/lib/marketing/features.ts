export interface Feature {
  description: string;
  iconVariant: "terra" | "teal" | "charcoal";
  title: string;
}

export const features: Feature[] = [
  {
    iconVariant: "terra",
    title: "White-label storefronts",
    description:
      "Every org gets a branded storefront with their name, logo, and campaign details. Buyers see the org — not the platform.",
  },
  {
    iconVariant: "teal",
    title: "Automatic Stripe payouts",
    description:
      "Three-way revenue splits calculated on every order. Roasters, orgs, and the platform all get paid via Stripe Connect — no invoices.",
  },
  {
    iconVariant: "charcoal",
    title: "Magic link fulfillment",
    description:
      "Roasters receive a secure one-click link to confirm, print shipping labels, and mark orders shipped — no portal login required.",
  },
  {
    iconVariant: "terra",
    title: "Live impact tracking",
    description:
      "Orgs see real-time fundraiser totals, order counts, and progress toward goals. Buyers see their contribution on the order confirmation page.",
  },
  {
    iconVariant: "teal",
    title: "Price snapshotting",
    description:
      "Retail and wholesale prices are frozen when a campaign item is added. Price changes never affect active campaigns or in-progress orders.",
  },
  {
    iconVariant: "charcoal",
    title: "48-hour SLA enforcement",
    description:
      "Orders that aren't shipped within 48 hours trigger escalation emails. After 96 hours, the platform can auto-refund — protecting buyers and org reputation.",
  },
];
