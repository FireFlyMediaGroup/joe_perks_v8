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
import { CURRENT_TERMS_VERSION, type ApplicationFormData } from "../_lib/schema";

interface StepTermsProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepTerms({ form }: StepTermsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Terms of service</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please review and accept the terms before submitting your application.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
        <p>
          By submitting this application, you agree to Joe Perks&apos;{" "}
          <Link
            href="/terms/roasters"
            target="_blank"
            className="font-medium text-primary underline underline-offset-4"
          >
            Roaster Terms of Service
          </Link>{" "}
          (version {CURRENT_TERMS_VERSION}) and{" "}
          <Link
            href="/privacy-policy"
            target="_blank"
            className="font-medium text-primary underline underline-offset-4"
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
                onCheckedChange={field.onChange}
                className="mt-0.5 min-h-[20px] min-w-[20px]"
              />
            </FormControl>
            <FormLabel className="text-sm font-normal leading-snug cursor-pointer">
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
