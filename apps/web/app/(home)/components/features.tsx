import { Clock, DollarSign, LineChart, Link2, Lock, Store } from "lucide-react";
import { features } from "@/lib/marketing/features";

const featureIcons = [
  <Store key="store" size={20} />,
  <DollarSign key="dollar" size={20} />,
  <Link2 key="link" size={20} />,
  <LineChart key="chart" size={20} />,
  <Lock key="lock" size={20} />,
  <Clock key="clock" size={20} />,
];

const iconColors: Record<string, string> = {
  terra: "bg-jp-terra/10 text-jp-terra",
  teal: "bg-jp-teal/10 text-jp-teal",
  charcoal: "bg-jp-charcoal/10 text-[var(--jp-text)]",
};

export const Features = () => (
  <section
    className="py-[72px] md:py-[100px]"
    id="features"
    style={{ backgroundColor: "var(--jp-bg-alt)" }}
  >
    <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
      {/* Header */}
      <div className="reveal mb-12 text-center">
        <span className="mb-3 inline-block font-jp-mono font-medium text-[10px] text-[var(--jp-muted)] uppercase tracking-[0.14em]">
          Platform features
        </span>
        <h2 className="mx-auto max-w-xl font-black font-display text-[clamp(32px,4vw,52px)] text-[var(--jp-text)] leading-[1.1] tracking-[-0.025em]">
          Built for both sides of the table.
        </h2>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <div
            className="group relative overflow-hidden rounded-[var(--jp-radius-lg)] border p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--jp-shadow-md)]"
            key={feature.title}
            style={{
              backgroundColor: "var(--jp-bg-card)",
              borderColor: "var(--jp-border)",
            }}
          >
            {/* Hover gradient bar */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-jp-terra to-jp-teal opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Icon */}
            <div
              className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[var(--jp-radius-sm)] ${iconColors[feature.iconVariant]}`}
            >
              {featureIcons[i]}
            </div>

            <h3 className="mb-2 font-bold font-display text-[19px] text-[var(--jp-text)]">
              {feature.title}
            </h3>
            <p className="font-body text-[var(--jp-muted)] text-sm leading-[1.7]">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
