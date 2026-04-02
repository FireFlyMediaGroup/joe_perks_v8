export interface Step {
  num: string;
  iconVariant: "terra" | "teal" | "white";
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    num: "01",
    iconVariant: "terra",
    title: "Org launches a campaign",
    description:
      "A school, sports team, or nonprofit picks a local roaster, sets their fundraiser percentage, and gets a branded storefront link in minutes.",
  },
  {
    num: "02",
    iconVariant: "teal",
    title: "Community buys great coffee",
    description:
      "Buyers shop the org-branded storefront and checkout with Stripe. No accounts, no donation fatigue — just a real product people want.",
  },
  {
    num: "03",
    iconVariant: "white",
    title: "Everyone gets paid automatically",
    description:
      "Joe Perks splits every order three ways: roaster, org, and platform. Payouts flow via Stripe Connect. Transparent. Automatic.",
  },
];

export interface SplitBar {
  party: string;
  amount: string;
  pct: string;
  color: string;
  width: string;
}

export const splitExample: SplitBar[] = [
  {
    party: "Roaster",
    amount: "$13.20",
    pct: "66%",
    color: "bg-white/25",
    width: "66%",
  },
  {
    party: "Organization",
    amount: "$3.00",
    pct: "15%",
    color: "bg-jp-terra",
    width: "15%",
  },
  {
    party: "Platform",
    amount: "$1.00",
    pct: "5%",
    color: "bg-jp-teal",
    width: "5%",
  },
  {
    party: "Stripe fees",
    amount: "$0.88",
    pct: "~4%",
    color: "bg-white/10",
    width: "4%",
  },
];
