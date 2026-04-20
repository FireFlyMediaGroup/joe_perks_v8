import { ArrowRight, Heart, RefreshCcw, Shield } from "lucide-react";
import { benefits, impactCalc } from "@/lib/marketing/benefits";

const benefitIcons = [
  <RefreshCcw key="refresh" size={20} />,
  <Heart key="heart" size={20} />,
  <Shield key="shield" size={20} />,
];

const iconColors: Record<string, string> = {
  terra: "bg-jp-terra/10 text-jp-terra",
  teal: "bg-jp-teal/10 text-jp-teal",
};

export const BenefitsSection = () => (
  <section
    className="py-[72px] md:py-[100px]"
    style={{ backgroundColor: "var(--jp-bg-alt)" }}
  >
    <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
      <div className="reveal grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Impact calculator (left) */}
        <div
          className="overflow-hidden rounded-[var(--jp-radius-xl)] p-6 md:p-8"
          style={{ backgroundColor: "var(--jp-bg-dark)" }}
        >
          <span className="mb-4 block font-jp-mono font-medium text-[10px] text-white/40 uppercase tracking-[0.14em]">
            Impact calculator
          </span>
          <h3 className="mb-6 font-bold font-display text-2xl text-white">
            See your potential
          </h3>

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div
              className="flex flex-col items-center rounded-[var(--jp-radius-md)] p-3"
              style={{ backgroundColor: "var(--jp-bg-dark-raised)" }}
            >
              <span className="font-bold font-display text-2xl text-white">
                {impactCalc.avgOrder}
              </span>
              <span className="font-jp-mono font-medium text-[9px] text-white/40 uppercase tracking-[0.12em]">
                {impactCalc.avgOrderLabel}
              </span>
            </div>
            <div
              className="flex flex-col items-center rounded-[var(--jp-radius-md)] p-3"
              style={{ backgroundColor: "var(--jp-bg-dark-raised)" }}
            >
              <span className="font-bold font-display text-2xl text-white">
                {impactCalc.buyers}
              </span>
              <span className="font-jp-mono font-medium text-[9px] text-white/40 uppercase tracking-[0.12em]">
                {impactCalc.buyersLabel}
              </span>
            </div>
            <div
              className="flex flex-col items-center rounded-[var(--jp-radius-md)] p-3"
              style={{ backgroundColor: "var(--jp-bg-dark-raised)" }}
            >
              <span className="font-bold font-display text-2xl text-jp-terra-light">
                {impactCalc.orgPct}
              </span>
              <span className="font-jp-mono font-medium text-[9px] text-white/40 uppercase tracking-[0.12em]">
                {impactCalc.orgPctLabel}
              </span>
            </div>
          </div>

          {/* Result */}
          <div className="flex items-center gap-3 rounded-[var(--jp-radius-md)] border border-jp-terra/30 bg-jp-terra/10 p-4">
            <ArrowRight className="shrink-0 text-jp-terra-light" size={16} />
            <div className="flex flex-col">
              <span className="font-black font-display text-3xl text-white">
                {impactCalc.monthlyTotal}
              </span>
              <span className="font-jp-mono font-medium text-[10px] text-white/50 uppercase tracking-[0.12em]">
                {impactCalc.monthlyTotalLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Benefits list (right) */}
        <div className="flex flex-col gap-8">
          <div>
            <span className="mb-3 inline-block font-jp-mono font-medium text-[10px] text-[var(--jp-muted)] uppercase tracking-[0.14em]">
              Why coffee fundraising?
            </span>
            <h2 className="max-w-md font-black font-display text-[clamp(32px,4vw,42px)] text-[var(--jp-text)] leading-[1.1] tracking-[-0.025em]">
              Better than a bake sale.
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            {benefits.map((benefit, i) => (
              <div className="flex gap-4" key={benefit.title}>
                <div
                  className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--jp-radius-sm)] ${iconColors[benefit.iconVariant]}`}
                >
                  {benefitIcons[i]}
                </div>
                <div>
                  <h3 className="mb-1 font-bold font-display text-[var(--jp-text)] text-lg">
                    {benefit.title}
                  </h3>
                  <p className="font-body text-[var(--jp-muted)] text-sm leading-[1.7]">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
