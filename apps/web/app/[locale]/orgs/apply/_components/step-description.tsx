"use client";

import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";

interface StepDescriptionProps {
  readonly description: string;
  readonly errors: Record<string, string>;
  readonly onDescription: (v: string) => void;
}

export function StepDescription({
  description,
  errors,
  onDescription,
}: StepDescriptionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">About your organization</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Help us understand who you are and why fundraising with Joe Perks is a
          good fit. This is shown to our team during review — buyers won&apos;t
          see it.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-description">Organization description</Label>
        <Textarea
          className="min-h-[140px]"
          id="org-description"
          maxLength={2000}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="Tell us about your organization — your mission, how many members you have, what the fundraiser will support, etc."
          value={description}
        />
        <p className="text-muted-foreground text-xs">
          Optional — up to 2,000 characters ({2000 - description.length}{" "}
          remaining)
        </p>
        {errors.description ? (
          <p className="text-destructive text-sm">{errors.description}</p>
        ) : null}
      </div>
    </div>
  );
}
