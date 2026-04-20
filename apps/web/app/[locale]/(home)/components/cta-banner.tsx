import { MoveRight } from "lucide-react";
import Link from "next/link";

export const CtaBanner = () => (
  <section
    className="py-[72px] md:py-[100px]"
    style={{
      background: `
        radial-gradient(ellipse 50% 50% at 20% 50%, rgba(212,96,58,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 50% 50% at 80% 50%, rgba(74,140,140,0.10) 0%, transparent 70%),
        var(--jp-bg-dark)
      `,
    }}
  >
    <div className="mx-auto max-w-[700px] px-6 text-center md:px-10">
      <div className="reveal">
        <h2 className="mb-4 font-black font-display text-[clamp(32px,4vw,52px)] text-white leading-[1.1] tracking-[-0.025em]">
          Ready to brew <em className="text-jp-terra-light">something good</em>?
        </h2>
        <p className="mx-auto mb-8 max-w-md font-body text-base text-white/60 leading-relaxed">
          Whether you run an org or roast the beans, Joe Perks makes fundraising
          feel less like work and more like community.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            className="group inline-flex items-center gap-2 rounded-[var(--jp-radius-md)] bg-jp-terra px-6 py-3 font-body font-semibold text-sm text-white shadow-[var(--jp-shadow-sm)] transition-all hover:-translate-y-px hover:bg-jp-terra-dark hover:shadow-[0_6px_20px_rgba(212,96,58,0.35)]"
            href="/orgs/apply"
          >
            Start your fundraiser
            <MoveRight
              className="transition-transform group-hover:translate-x-0.5"
              size={14}
            />
          </Link>
          <Link
            className="group inline-flex items-center gap-2 rounded-[var(--jp-radius-md)] border border-white/20 px-6 py-3 font-body font-semibold text-sm text-white transition-all hover:-translate-y-px hover:border-white/40 hover:bg-white/5"
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
