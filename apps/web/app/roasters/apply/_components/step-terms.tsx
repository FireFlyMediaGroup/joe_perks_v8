"use client";

import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import {
  type ApplicationFormData,
  CURRENT_TERMS_VERSION,
} from "../_lib/schema";

interface StepTermsProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepTerms({ form }: StepTermsProps) {
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
            href="/terms/roasters"
            target="_blank"
          >
            Roaster Terms of Service
          </Link>{" "}
          (version {CURRENT_TERMS_VERSION}) and{" "}
          <Link
            className="font-medium text-primary underline underline-offset-4"
            href="/privacy-policy"
            target="_blank"
          >
            Privacy Policy
          </Link>
          . If your application is approved, you will set up Stripe Express for
          payment processing.
        </p>
      </div>

      <FormField
        control={form.control}
        name="termsAccepted"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                className="mt-0.5 min-h-[20px] min-w-[20px]"
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="cursor-pointer font-normal text-sm leading-snug">
              I have read and agree to the Roaster Terms of Service (v
              {CURRENT_TERMS_VERSION}) and Privacy Policy *
            </FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
