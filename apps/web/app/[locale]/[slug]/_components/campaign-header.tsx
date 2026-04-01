import type { ReactNode } from "react";

interface CampaignHeaderProps {
  /** Cart trigger (client) — top-right of the hero band */
  actions?: ReactNode;
  campaignName: string;
  goalCents: number | null;
  orgName: string;
  orgPct: number;
  totalRaisedCents: number;
}

export function CampaignHeader({
  orgName,
  campaignName,
  orgPct,
  goalCents,
  totalRaisedCents,
  actions,
}: CampaignHeaderProps) {
  const pctDisplay = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(orgPct * 100);
  const showGoal = goalCents !== null && goalCents > 0;
  const progress = showGoal
    ? Math.min(100, (totalRaisedCents / goalCents) * 100)
    : 0;

  return (
    <header className="border-border/60 border-b bg-[#FDF9F4] pt-10 pb-8">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-widest">
            {orgName}
          </p>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        <h1 className="mb-3 font-bold text-3xl text-foreground tracking-tight md:text-4xl">
          {campaignName}
        </h1>
        <p className="max-w-2xl text-foreground/90 text-lg leading-relaxed">
          <span className="font-semibold text-[#D4603A]">{pctDisplay}%</span> of
          every purchase supports {orgName}.
        </p>
        {showGoal ? (
          <div className="mt-8 max-w-xl">
            <div className="mb-2 flex justify-between text-muted-foreground text-sm">
              <span>Raised</span>
              <span>
                ${(totalRaisedCents / 100).toFixed(2)} / $
                {(goalCents / 100).toFixed(2)}
              </span>
            </div>
            <div
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress)}
              className="h-3 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-[#D4603A] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
