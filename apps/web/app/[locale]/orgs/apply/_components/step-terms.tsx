"use client";

import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { Label } from "@repo/design-system/components/ui/label";
import Link from "next/link";

import { CURRENT_ORG_TERMS_VERSION } from "../_lib/schema";

interface StepTermsProps {
  readonly errors: Record<string, string>;
  readonly onTermsAccepted: (v: boolean) => void;
  readonly termsAccepted: boolean;
}

export function StepTerms({
  termsAccepted,
  errors,
  onTermsAccepted,
}: StepTermsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Terms of service</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Please review and accept the terms before submitting your application.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-muted-foreground text-sm">
        <p>
          By submitting this application, you agree to Joe Perks&apos;{" "}
          <Link
            className="font-medium text-primary underline underline-offset-4"
            href="/terms/orgs"
            target="_blank"
          >
            Organization Terms of Service
          </Link>{" "}
          (version {CURRENT_ORG_TERMS_VERSION}) and{" "}
          <Link
            className="font-medium text-primary underline underline-offset-4"
            href="/privacy-policy"
            target="_blank"
          >
            Privacy Policy
          </Link>
          . After approval, your organization will be connected with your chosen
          roaster partner and a fundraising storefront will be created.
        </p>
      </div>

      <div className="flex flex-row items-start gap-3 space-y-0">
        <Checkbox
          checked={termsAccepted}
          className="mt-0.5 min-h-[20px] min-w-[20px]"
          id="org-terms"
          onCheckedChange={(v) => onTermsAccepted(Boolean(v))}
        />
        <Label
          className="cursor-pointer font-normal text-sm leading-snug"
          htmlFor="org-terms"
        >
          I have read and agree to the Organization Terms of Service (v
          {CURRENT_ORG_TERMS_VERSION}) and Privacy Policy *
        </Label>
      </div>

      {errors.termsAccepted ? (
        <p className="text-destructive text-sm">{errors.termsAccepted}</p>
      ) : null}
    </div>
  );
}
