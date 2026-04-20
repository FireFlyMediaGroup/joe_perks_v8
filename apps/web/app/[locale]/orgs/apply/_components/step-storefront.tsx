"use client";

import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export type SlugStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "reserved"
  | "pending"
  | "invalid_format"
  | "too_short";

const SLUG_REASON_LABELS: Record<string, string> = {
  taken: "This URL is already taken.",
  reserved: "This URL is reserved and cannot be used.",
  pending: "This URL is already claimed by another pending application.",
  invalid_format:
    "Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.",
};

interface StepStorefrontProps {
  readonly desiredSlug: string;
  readonly errors: Record<string, string>;
  readonly onSlugChange: (slug: string, status: SlugStatus) => void;
  readonly slugStatus: SlugStatus;
}

function slugStatusIcon(status: SlugStatus) {
  if (status === "checking") {
    return (
      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
    );
  }
  if (status === "available") {
    return <CheckCircle2Icon className="size-4 text-green-600" />;
  }
  if (
    status === "taken" ||
    status === "reserved" ||
    status === "pending" ||
    status === "invalid_format"
  ) {
    return <XCircleIcon className="size-4 text-destructive" />;
  }
  return null;
}

function SlugHint({
  slugStatus,
  reasonLabel,
  rawLength,
}: {
  slugStatus: SlugStatus;
  reasonLabel: string | undefined;
  rawLength: number;
}) {
  if (slugStatus === "available") {
    return <p className="text-green-600 text-sm">This URL is available!</p>;
  }
  if (reasonLabel) {
    return <p className="text-destructive text-sm">{reasonLabel}</p>;
  }
  if (rawLength > 0 && rawLength < 3) {
    return (
      <p className="text-muted-foreground text-sm">
        At least 3 characters required.
      </p>
    );
  }
  return (
    <p className="text-muted-foreground text-sm">
      Use lowercase letters, numbers, and hyphens only. 3–63 characters.
    </p>
  );
}

export function StepStorefront({
  desiredSlug,
  slugStatus,
  onSlugChange,
  errors,
}: StepStorefrontProps) {
  const [raw, setRaw] = useState(desiredSlug);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const validate = useCallback(
    async (slug: string) => {
      if (slug.length < 3) {
        onSlugChange(slug, "too_short");
        return;
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
      onSlugChange(slug, "checking");
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/slugs/validate?slug=${encodeURIComponent(slug)}`,
          { signal: controller.signal }
        );
        const json = (await res.json()) as {
          available: boolean;
          reason?: string;
        };
        if (json.available) {
          onSlugChange(slug, "available");
        } else {
          onSlugChange(slug, (json.reason ?? "taken") as SlugStatus);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          onSlugChange(slug, "idle");
        }
      }
    },
    [onSlugChange]
  );

  function handleChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setRaw(cleaned);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSlugChange(cleaned, cleaned.length < 3 ? "too_short" : "checking");
    debounceRef.current = setTimeout(() => {
      validate(cleaned);
    }, 350);
  }

  const reasonLabel =
    slugStatus in SLUG_REASON_LABELS
      ? SLUG_REASON_LABELS[slugStatus]
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Your storefront URL</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Choose a unique, memorable URL for your fundraising storefront. Buyers
          will share this link to support your campaign.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desired-slug">Storefront URL *</Label>
        <div className="relative">
          <div className="flex items-center rounded-md border bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="select-none rounded-l-md border-r bg-muted px-3 py-2.5 text-muted-foreground text-sm">
              joeperks.com/
            </span>
            <Input
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              className="min-h-[44px] flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              id="desired-slug"
              onChange={(e) => handleChange(e.target.value)}
              placeholder="lincoln-pta"
              spellCheck={false}
              value={raw}
            />
            <span className="pr-3">{slugStatusIcon(slugStatus)}</span>
          </div>
        </div>

        <SlugHint
          rawLength={raw.length}
          reasonLabel={reasonLabel}
          slugStatus={slugStatus}
        />

        {errors.desiredSlug ? (
          <p className="text-destructive text-sm">{errors.desiredSlug}</p>
        ) : null}
      </div>

      {raw && slugStatus === "available" ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          Your storefront will be at{" "}
          <span className="font-medium">joeperks.com/{raw}</span>
        </div>
      ) : null}
    </div>
  );
}
