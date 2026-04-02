export interface Benefit {
  iconVariant: "terra" | "teal";
  title: string;
  description: string;
}

export const benefits: Benefit[] = [
  {
    iconVariant: "terra",
    title: "Recurring, not one-time",
    description:
      "Coffee is a repeat purchase. Unlike wrapping paper or popcorn, supporters come back month after month — compounding fundraiser impact.",
  },
  {
    iconVariant: "teal",
    title: "No donation fatigue",
    description:
      "People buy a product they actually want. No guilt-driven asks, no cold calls. Just a great bag of coffee that also supports the community.",
  },
  {
    iconVariant: "terra",
    title: "Transparent splits",
    description:
      "Every party sees exactly how the money flows — roaster, org, platform. No hidden fees, no surprising deductions. Trust built into the math.",
  },
];

export const impactCalc = {
  avgOrder: "$21.00",
  avgOrderLabel: "avg order",
  buyers: "50",
  buyersLabel: "buyers/mo",
  orgPct: "15%",
  orgPctLabel: "org split",
  monthlyTotal: "$157.50",
  monthlyTotalLabel: "monthly to your org",
};
