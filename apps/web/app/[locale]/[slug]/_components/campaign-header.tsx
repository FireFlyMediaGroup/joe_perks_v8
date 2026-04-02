import { Heart } from "lucide-react";
import type { ReactNode } from "react";

interface CampaignHeaderProps {
  actions?: ReactNode;
  campaignName: string;
  goalCents: number | null;
  orgName: string;
  orgPct: number;
  totalRaisedCents: number;
}

function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
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
    <header className="border-jp-border border-b bg-jp-bg-page pt-12 pb-10 md:pt-16 md:pb-12">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <p className="font-jp-mono text-[11px] text-jp-muted uppercase tracking-[0.14em]">
            {orgName}
          </p>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>

        <h1 className="mb-4 font-black font-display text-[clamp(2rem,5vw,3.25rem)] text-jp-text leading-[1.1] tracking-tight">
          {campaignName}
        </h1>

        <p className="max-w-2xl font-body text-jp-text/85 text-lg leading-relaxed">
          <Heart className="mr-1.5 inline-block size-[18px] -translate-y-px text-jp-terra" />
          <span className="font-semibold text-jp-terra">{pctDisplay}%</span> of
          every purchase supports {orgName}.
        </p>

        {showGoal ? (
          <div className="mt-10 max-w-xl">
            <div className="mb-2.5 flex items-baseline justify-between gap-4">
              <span className="font-jp-mono text-[10px] text-jp-muted uppercase tracking-[0.14em]">
                Fundraiser progress
              </span>
              <span className="font-body font-medium text-jp-text text-sm tabular-nums">
                {formatDollars(totalRaisedCents)}
                <span className="text-jp-muted">
                  {" "}
                  / {formatDollars(goalCents)}
                </span>
              </span>
            </div>
            <div
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(progress)}
              className="h-3.5 w-full overflow-hidden rounded-full bg-jp-bg-alt"
              role="progressbar"
              style={{ boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div
                className="h-full rounded-full bg-jp-terra transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 font-body text-jp-light text-xs">
              {progress.toFixed(0)}% of goal reached
            </p>
          </div>
        ) : null}
      </div>
    </header>
  );
}
