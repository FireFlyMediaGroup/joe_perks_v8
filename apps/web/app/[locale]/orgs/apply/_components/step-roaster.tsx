"use client";

import { Label } from "@repo/design-system/components/ui/label";
import { Slider } from "@repo/design-system/components/ui/slider";
import { CheckIcon } from "lucide-react";

export interface ActiveRoaster {
  businessName: string;
  email: string;
  id: string;
}

interface RoasterCardProps {
  readonly backupRoasterId: string;
  readonly onSelect: () => void;
  readonly primaryRoasterId: string;
  readonly roaster: ActiveRoaster;
}

function getRoasterCardClass(isPrimary: boolean, isBackup: boolean): string {
  if (isPrimary) {
    return "border-primary bg-primary/5 ring-2 ring-primary";
  }
  if (isBackup) {
    return "border-muted-foreground/40 bg-muted/30 ring-1 ring-muted-foreground/30";
  }
  return "border-border hover:bg-muted/30";
}

function getRoasterSelectionLabel(
  isPrimary: boolean,
  isBackup: boolean,
  primaryRoasterId: string
): string {
  if (isPrimary) {
    return "Primary partner";
  }
  if (isBackup) {
    return "Backup — click to remove";
  }
  if (primaryRoasterId) {
    return "Click to add as backup";
  }
  return "Click to select as primary";
}

function getRoasterSelectionLabelClass(isPrimary: boolean): string {
  if (isPrimary) {
    return "mt-1 text-primary text-xs font-medium";
  }
  return "mt-1 text-muted-foreground text-xs";
}

function RoasterCard({
  roaster,
  primaryRoasterId,
  backupRoasterId,
  onSelect,
}: RoasterCardProps) {
  const isPrimary = roaster.id === primaryRoasterId;
  const isBackup = roaster.id === backupRoasterId;

  return (
    <button
      className={`relative rounded-lg border p-4 text-left transition-colors ${getRoasterCardClass(isPrimary, isBackup)}`}
      onClick={onSelect}
      type="button"
    >
      {isPrimary || isBackup ? (
        <span
          className={`absolute top-2 right-2 flex size-5 items-center justify-center rounded-full font-bold text-white text-xs ${isPrimary ? "bg-primary" : "bg-muted-foreground/60"}`}
        >
          {isPrimary ? <CheckIcon className="size-3" /> : "2"}
        </span>
      ) : null}
      <p className="pr-6 font-medium text-sm">{roaster.businessName}</p>
      <p className="mt-0.5 text-muted-foreground text-xs">{roaster.email}</p>
      <p className={getRoasterSelectionLabelClass(isPrimary)}>
        {getRoasterSelectionLabel(isPrimary, isBackup, primaryRoasterId)}
      </p>
    </button>
  );
}

interface StepRoasterProps {
  readonly backupRoasterId: string;
  readonly desiredOrgPctPct: number;
  readonly errors: Record<string, string>;
  readonly onBackupRoaster: (id: string) => void;
  readonly onDesiredOrgPctPct: (pct: number) => void;
  readonly onPrimaryRoaster: (id: string) => void;
  readonly orgPctMax: number;
  readonly orgPctMin: number;
  readonly primaryRoasterId: string;
  readonly roasters: ActiveRoaster[];
}

export function StepRoaster({
  roasters,
  primaryRoasterId,
  backupRoasterId,
  desiredOrgPctPct,
  orgPctMin,
  orgPctMax,
  errors,
  onPrimaryRoaster,
  onBackupRoaster,
  onDesiredOrgPctPct,
}: StepRoasterProps) {
  const minPct = Math.round(orgPctMin * 100);
  const maxPct = Math.round(orgPctMax * 100);

  function handleRoasterSelect(roasterId: string) {
    const isPrimary = roasterId === primaryRoasterId;
    const isBackup = roasterId === backupRoasterId;

    if (isPrimary) {
      return;
    }
    if (isBackup) {
      onBackupRoaster("");
      return;
    }
    if (primaryRoasterId) {
      onBackupRoaster(roasterId);
    } else {
      onPrimaryRoaster(roasterId);
    }
  }

  return (
    <div className="space-y-8">
      {/* Roaster selection */}
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Choose your roaster partner</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Select a primary roaster. You can optionally add a backup roaster —
            if your primary is unavailable, we&apos;ll reach out to the backup.
          </p>
        </div>

        {roasters.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No active roaster partners are available right now. Check back soon.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {roasters.map((r) => (
              <RoasterCard
                backupRoasterId={backupRoasterId}
                key={r.id}
                onSelect={() => handleRoasterSelect(r.id)}
                primaryRoasterId={primaryRoasterId}
                roaster={r}
              />
            ))}
          </div>
        )}

        {errors.primaryRoasterId ? (
          <p className="text-destructive text-sm">{errors.primaryRoasterId}</p>
        ) : null}
      </div>

      {/* Fundraiser percentage */}
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Fundraiser percentage</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Choose the percentage of each sale that goes directly to your
            organization. Platform allows {minPct}%–{maxPct}%.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Your cut per sale</Label>
            <span className="font-semibold text-lg tabular-nums">
              {desiredOrgPctPct}%
            </span>
          </div>
          <Slider
            max={maxPct}
            min={minPct}
            onValueChange={([v]) => onDesiredOrgPctPct(v)}
            step={1}
            value={[desiredOrgPctPct]}
          />
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>{minPct}%</span>
            <span>{maxPct}%</span>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="text-muted-foreground">
            On a <strong className="text-foreground">$20 bag</strong>, your
            organization receives{" "}
            <strong className="text-foreground">
              ${((20 * desiredOrgPctPct) / 100).toFixed(2)}
            </strong>
            . The roaster keeps the rest after the platform fee.
          </p>
        </div>

        {errors.desiredOrgPct ? (
          <p className="text-destructive text-sm">{errors.desiredOrgPct}</p>
        ) : null}
      </div>
    </div>
  );
}
