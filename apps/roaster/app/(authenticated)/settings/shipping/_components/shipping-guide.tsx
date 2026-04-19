"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/design-system/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface StrategyExample {
  carrier: string;
  isDefault?: boolean;
  label: string;
  rate: string;
}

interface Strategy {
  description: string;
  examples: StrategyExample[];
  title: string;
}

const STRATEGIES: Strategy[] = [
  {
    title: "Simple flat rate",
    description:
      "One rate covers all orders. The easiest to set up and the right choice if your actual shipping cost doesn't vary much between small and large orders.",
    examples: [
      {
        label: "Standard Shipping",
        carrier: "USPS",
        rate: "$8.95",
        isDefault: true,
      },
    ],
  },
  {
    title: "Speed tiers",
    description:
      "Offer a faster option for buyers who need it. Your default rate handles most orders; the expedited rate is buyer-selected at checkout.",
    examples: [
      {
        label: "Standard 3–5 days",
        carrier: "USPS",
        rate: "$8.95",
        isDefault: true,
      },
      { label: "Expedited 2 days", carrier: "UPS", rate: "$16.95" },
    ],
  },
  {
    title: "Volume tiers (by bag count)",
    description:
      "If shipping more bags meaningfully raises your cost, create one rate per quantity band. Buyers see all options and pick the one that matches their order size. Use descriptive labels so they know which to choose.",
    examples: [
      { label: "1–2 bags", carrier: "USPS", rate: "$7.95", isDefault: true },
      { label: "3–4 bags", carrier: "USPS", rate: "$10.95" },
      { label: "5+ bags", carrier: "USPS", rate: "$13.95" },
    ],
  },
];

function ExampleTable({ examples }: { examples: StrategyExample[] }) {
  return (
    <table className="mt-2 w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground text-xs">
          <th className="pr-4 pb-1 font-medium">Label (buyer sees this)</th>
          <th className="pr-4 pb-1 font-medium">Carrier</th>
          <th className="pb-1 font-medium">Rate</th>
        </tr>
      </thead>
      <tbody>
        {examples.map((ex) => (
          <tr className="border-b last:border-0" key={ex.label}>
            <td className="py-1.5 pr-4 font-medium">
              {ex.label}
              {ex.isDefault ? (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 font-normal text-muted-foreground text-xs">
                  default
                </span>
              ) : null}
            </td>
            <td className="py-1.5 pr-4 text-muted-foreground">{ex.carrier}</td>
            <td className="py-1.5 tabular-nums">{ex.rate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ShippingGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible className="mb-6" onOpenChange={setOpen} open={open}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-left font-medium text-sm transition-colors hover:bg-muted/60">
        <span>
          How to price your shipping rates — buyers choose at checkout
        </span>
        <ChevronDownIcon
          className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-none">
        <div className="rounded-b-lg border border-t-0 px-4 pt-3 pb-4">
          <p className="mb-4 text-muted-foreground text-xs leading-relaxed">
            Every rate you add appears as a choice at checkout. Your default
            rate is pre-selected — buyers can switch to another option before
            paying. Since shipping goes directly to you, price these to recover
            your actual cost.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {STRATEGIES.map((s) => (
              <div className="space-y-1" key={s.title}>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {s.description}
                </p>
                <ExampleTable examples={s.examples} />
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-md bg-muted/60 px-3 py-2 text-muted-foreground text-xs leading-relaxed">
            <strong className="font-medium text-foreground">Remember:</strong>{" "}
            The label is exactly what buyers see at checkout — be descriptive so
            they know which rate to pick. Shipping is passed through 100% to you
            and has no effect on the fundraiser percentage or platform fee.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
