import { MoveRight } from "lucide-react";
import Link from "next/link";

const stats = [
  { value: "5–25%", label: "to your org, every order" },
  { value: "48h", label: "fulfillment SLA" },
  { value: "$0", label: "upfront cost" },
];

export const Hero = () => (
  <section
    className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28"
    style={{
      background: `
        radial-gradient(ellipse 80% 60% at 70% 20%, rgba(212,96,58,0.07) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 20% 80%, rgba(74,140,140,0.07) 0%, transparent 60%),
        var(--jp-bg-page)
      `,
    }}
  >
    <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
      <div className="flex flex-col items-center text-center">
        {/* Eyebrow chips */}
        <div className="reveal mb-6 flex flex-wrap items-center justify-center gap-2">
          <span
            className="rounded-full px-3 py-1 font-jp-mono font-medium text-[10px] uppercase tracking-[0.14em]"
            style={{
              backgroundColor: "var(--jp-chip-bg)",
              border: "1px solid var(--jp-chip-border)",
              color: "var(--jp-chip-text)",
            }}
          >
            Coffee Fundraising
          </span>
          <span
            className="rounded-full px-3 py-1 font-jp-mono font-medium text-[10px] uppercase tracking-[0.14em]"
            style={{
              backgroundColor: "var(--jp-chip-bg)",
              border: "1px solid var(--jp-chip-border)",
              color: "var(--jp-chip-text)",
            }}
          >
            Beta · Q2 2026
          </span>
        </div>

        {/* H1 */}
        <h1 className="reveal reveal-delay-1 mb-5 max-w-3xl font-black font-display text-[clamp(42px,6vw,80px)] text-[var(--jp-text)] leading-[1.05] tracking-[-0.03em]">
          Coffee your community{" "}
          <em className="text-jp-terra">
            already
          </em>{" "}
          wants to buy.
        </h1>

        {/* Subtitle */}
        <p className="reveal reveal-delay-2 mb-10 max-w-[560px] font-body text-[17px] text-[var(--jp-muted)] leading-[1.65] md:text-lg">
          Connect local roasters with schools, sports teams, and nonprofits.
          Every bag sold funds what matters — automatically.
        </p>

        {/* Dual CTA cards */}
        <div className="reveal reveal-delay-3 mb-14 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Orgs card */}
          <Link
            className="group relative flex flex-col gap-3 rounded-[var(--jp-radius-xl)] bg-jp-terra p-6 text-left text-white shadow-[var(--jp-shadow-md)] transition-all hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(212,96,58,0.30)]"
            href="/orgs/apply"
          >
            <span className="font-jp-mono font-medium text-[10px] text-white/70 uppercase tracking-[0.14em]">
              For organizations
            </span>
            <span className="font-bold font-display text-xl">
              Fund what matters
            </span>
            <span className="font-body text-sm text-white/80 leading-relaxed">
              Turn coffee into recurring revenue for your school, team, or
              nonprofit.
            </span>
            <span className="mt-1 inline-flex items-center gap-2 font-body font-semibold text-sm transition-all group-hover:gap-[10px]">
              Apply your org <MoveRight size={14} />
            </span>
          </Link>

          {/* Roasters card */}
          <Link
            className="group relative flex flex-col gap-3 rounded-[var(--jp-radius-xl)] bg-jp-charcoal p-6 text-left text-white shadow-[var(--jp-shadow-md)] transition-all hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(28,28,30,0.40)]"
            href="/roasters/apply"
          >
            <span className="font-jp-mono font-medium text-[10px] text-white/70 uppercase tracking-[0.14em]">
              For roasters
            </span>
            <span className="font-bold font-display text-xl">
              Grow your reach
            </span>
            <span className="font-body text-sm text-white/80 leading-relaxed">
              Sell to communities that already want great coffee. No wholesale
              headaches.
            </span>
            <span className="mt-1 inline-flex items-center gap-2 font-body font-semibold text-jp-teal-light text-sm transition-all group-hover:gap-[10px]">
              Apply as roaster <MoveRight size={14} />
            </span>
          </Link>
        </div>

        {/* Stats bar */}
        <div className="reveal flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {stats.map((stat) => (
            <div className="flex flex-col items-center gap-1" key={stat.label}>
              <span className="font-black font-display text-3xl text-[var(--jp-text)] md:text-4xl">
                {stat.value}
              </span>
              <span className="font-jp-mono font-medium text-[10px] text-[var(--jp-muted)] uppercase tracking-[0.12em]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
