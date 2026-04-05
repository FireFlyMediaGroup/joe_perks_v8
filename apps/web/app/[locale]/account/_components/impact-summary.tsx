import { formatCentsAsDollars } from "../../[slug]/_lib/format";
import type { BuyerDashboardSummary } from "../_lib/dashboard";

interface BuyerImpactSummaryProps {
  readonly summary: BuyerDashboardSummary;
}

const SUMMARY_ITEMS: Array<{
  readonly description: string;
  readonly key: keyof BuyerDashboardSummary;
  readonly label: string;
}> = [
  {
    description: "Completed and in-progress purchases tied to your buyer account.",
    key: "orderCount",
    label: "Orders placed",
  },
  {
    description: "Your total spend across these orders.",
    key: "totalSpentCents",
    label: "Total spent",
  },
  {
    description: "Raised for fundraisers from the frozen order snapshots.",
    key: "totalImpactCents",
    label: "Raised for causes",
  },
];

function formatSummaryValue(
  key: keyof BuyerDashboardSummary,
  value: BuyerDashboardSummary[keyof BuyerDashboardSummary]
): string {
  if (key === "orderCount") {
    return new Intl.NumberFormat("en-US").format(value);
  }

  return formatCentsAsDollars(value);
}

export function BuyerImpactSummary({ summary }: BuyerImpactSummaryProps) {
  return (
    <section aria-labelledby="buyer-impact-summary-heading" className="space-y-4">
      <div className="space-y-2">
        <h2
          className="font-semibold text-foreground text-xl tracking-tight"
          id="buyer-impact-summary-heading"
        >
          Your impact so far
        </h2>
        <p className="max-w-2xl text-muted-foreground text-sm leading-6">
          Across {summary.orderCount} order{summary.orderCount === 1 ? "" : "s"},
          you&apos;ve helped raise {formatCentsAsDollars(summary.totalImpactCents)}
          for the organizations you support.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SUMMARY_ITEMS.map((item) => (
          <article
            className="rounded-2xl border bg-card p-5 shadow-sm"
            key={item.key}
          >
            <p className="font-medium text-muted-foreground text-sm">{item.label}</p>
            <p className="mt-3 font-semibold text-2xl text-foreground tracking-tight">
              {formatSummaryValue(item.key, summary[item.key])}
            </p>
            <p className="mt-2 text-muted-foreground text-sm leading-6">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
