import { Check, MoveRight } from "lucide-react";
import Link from "next/link";

const orgBullets = [
  "Launch a branded storefront in minutes",
  "Earn 5–25% of every order automatically",
  "Real-time fundraiser dashboard and totals",
  "No inventory, no shipping, no upfront cost",
  "Coffee people actually want to buy — not candles",
];

const roasterBullets = [
  "Access pre-qualified community audiences",
  "Orders fulfilled via magic link — no portal needed",
  "Wholesale price snapshotting protects margins",
  "Stripe Connect payouts, no invoicing",
  "48h SLA keeps buyer satisfaction high",
];

export const AudienceSection = () => (
  <section
    className="py-[72px] md:py-[100px]"
    id="for-orgs"
    style={{ backgroundColor: "var(--jp-bg-page)" }}
  >
    <div className="mx-auto max-w-[1200px] px-6 md:px-10 lg:px-16">
      <div className="reveal grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Orgs card */}
        <div className="flex flex-col justify-between rounded-[var(--jp-radius-xl)] bg-jp-terra p-8 text-white md:p-10">
          <div>
            <span className="mb-3 inline-block font-jp-mono font-medium text-[10px] text-white/60 uppercase tracking-[0.14em]">
              For organizations
            </span>
            <h2 className="mb-3 font-black font-display text-[clamp(28px,3.5vw,42px)] leading-[1.1] tracking-[-0.02em]">
              Turn every bag into impact.
            </h2>
            <p className="mb-6 max-w-md font-body text-[15px] text-white/75 leading-relaxed">
              Schools, sports teams, and nonprofits earn a real percentage on
              every order — not a one-time donation.
            </p>
            <ul className="mb-8 flex flex-col gap-3">
              {orgBullets.map((bullet) => (
                <li
                  className="flex items-start gap-3 font-body text-sm text-white/85"
                  key={bullet}
                >
                  <Check className="mt-0.5 shrink-0 text-white/60" size={16} />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <Link
            className="group inline-flex w-fit items-center gap-2 rounded-[var(--jp-radius-md)] bg-white px-6 py-3 font-body font-semibold text-jp-terra text-sm shadow-[var(--jp-shadow-sm)] transition-all hover:-translate-y-px hover:shadow-[var(--jp-shadow-md)]"
            href="/orgs/apply"
          >
            Start your fundraiser
            <MoveRight
              className="transition-transform group-hover:translate-x-0.5"
              size={14}
            />
          </Link>
        </div>

        {/* Roasters card */}
        <div
          className="flex flex-col justify-between rounded-[var(--jp-radius-xl)] p-8 text-white md:p-10"
          id="for-roasters"
          style={{ backgroundColor: "var(--jp-bg-dark)" }}
        >
          <div>
            <span className="mb-3 inline-block font-jp-mono font-medium text-[10px] text-white/60 uppercase tracking-[0.14em]">
              For roasters
            </span>
            <h2 className="mb-3 font-black font-display text-[clamp(28px,3.5vw,42px)] leading-[1.1] tracking-[-0.02em]">
              Sell to communities who care.
            </h2>
            <p className="mb-6 max-w-md font-body text-[15px] text-white/75 leading-relaxed">
              Reach pre-qualified groups of buyers who are already motivated.
              Focus on roasting — we handle the marketplace.
            </p>
            <ul className="mb-8 flex flex-col gap-3">
              {roasterBullets.map((bullet) => (
                <li
                  className="flex items-start gap-3 font-body text-sm text-white/85"
                  key={bullet}
                >
                  <Check
                    className="mt-0.5 shrink-0 text-jp-teal-light"
                    size={16}
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <Link
            className="group inline-flex w-fit items-center gap-2 rounded-[var(--jp-radius-md)] bg-jp-teal px-6 py-3 font-body font-semibold text-sm text-white shadow-[var(--jp-shadow-sm)] transition-all hover:-translate-y-px hover:bg-jp-teal-dark hover:shadow-[0_6px_20px_rgba(74,140,140,0.35)]"
            href="/roasters/apply"
          >
            Apply as a roaster
            <MoveRight
              className="transition-transform group-hover:translate-x-0.5"
              size={14}
            />
          </Link>
        </div>
      </div>
    </div>
  </section>
);
