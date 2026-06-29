import { Coffee, CreditCard, Package } from "lucide-react";
import { splitExample, steps } from "@/lib/marketing/steps";

const stepIcons = [
  <Coffee key="coffee" size={24} />,
  <CreditCard key="card" size={24} />,
  <Package key="package" size={24} />,
];

const iconBg: Record<string, string> = {
  terra: "bg-jp-terra/20 text-jp-terra-light",
  teal: "bg-jp-teal/20 text-jp-teal-light",
  white: "bg-white/10 text-white",
};

export const HowItWorks = () => (
  <section
    className="py-[72px] md:py-[100px]"
    id="how-it-works"
    style={{ backgroundColor: "var(--jp-bg-dark)" }}
  >
    <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
      {/* Header */}
      <div className="reveal mb-12 text-center">
        <span className="mb-3 inline-block font-jp-mono font-medium text-[10px] text-[var(--jp-teal-light)] uppercase tracking-[0.14em]">
          How it works
        </span>
        <h2 className="mx-auto max-w-xl font-black font-display text-[clamp(32px,4vw,52px)] text-white leading-[1.1] tracking-[-0.025em]">
          Three steps. Everyone wins.
        </h2>
      </div>

      {/* Step cards */}
      <div className="reveal mb-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            className="group relative overflow-hidden rounded-[var(--jp-radius-lg)] p-6 transition-all hover:-translate-y-1"
            key={step.num}
            style={{ backgroundColor: "var(--jp-bg-dark-raised)" }}
          >
            {/* Ghost number */}
            <span className="absolute top-4 right-5 font-black font-display text-6xl text-white/[0.04]">
              {step.num}
            </span>

            {/* Icon */}
            <div
              className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-[var(--jp-radius-sm)] ${iconBg[step.iconVariant]}`}
            >
              {stepIcons[i]}
            </div>

            <h3 className="mb-2 font-bold font-display text-lg text-white">
              {step.title}
            </h3>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              {step.description}
            </p>

            {/* Hover gradient bar */}
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-jp-terra to-jp-teal opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        ))}
      </div>

      {/* Revenue split visual */}
      <div
        className="reveal overflow-hidden rounded-[var(--jp-radius-xl)] p-6 md:p-8"
        style={{ backgroundColor: "var(--jp-bg-dark-raised)" }}
      >
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <span className="mb-1 block font-jp-mono font-medium text-[10px] text-white/40 uppercase tracking-[0.14em]">
              Revenue split on a $20.00 order
            </span>
            <span className="font-bold font-display text-2xl text-white">
              Where the money goes
            </span>
          </div>
          <span className="hidden font-jp-mono text-white/40 text-xs md:block">
            at 15% org split
          </span>
        </div>

        {/* Proportional bars */}
        <div className="mb-5 flex h-10 overflow-hidden rounded-[var(--jp-radius-md)]">
          {splitExample.map((bar) => (
            <div
              className={`${bar.color} flex items-center justify-center transition-all`}
              key={bar.party}
              style={{ width: bar.width, minWidth: "32px" }}
            >
              <span className="font-jp-mono font-medium text-[10px] text-white/80">
                {bar.pct}
              </span>
            </div>
          ))}
          {/* Remaining space (shipping passthrough placeholder) */}
          <div className="flex-1 bg-white/[0.03]" />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {splitExample.map((bar) => (
            <div className="flex items-center gap-2" key={bar.party}>
              <div className={`h-3 w-3 rounded-sm ${bar.color}`} />
              <div className="flex flex-col">
                <span className="font-body font-medium text-white/80 text-xs">
                  {bar.party}
                </span>
                <span className="font-jp-mono text-[11px] text-white/50">
                  {bar.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
