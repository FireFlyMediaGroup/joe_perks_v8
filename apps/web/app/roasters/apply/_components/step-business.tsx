"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";
import type { ApplicationFormData } from "../_lib/schema";

interface StepBusinessProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepBusiness({ form }: StepBusinessProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Business details</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Tell us about your roasting business.
        </p>
      </div>

      <FormField
        control={form.control}
        name="businessName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business name *</FormLabel>
            <FormControl>
              <Input
                className="min-h-[44px]"
                placeholder="North Star Roasting Co."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website</FormLabel>
            <FormControl>
              <Input
                className="min-h-[44px]"
                placeholder="https://yourroastery.com"
                type="url"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business description</FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[100px]"
                placeholder="Tell us about your roastery, your story, and what makes your coffee special..."
                {...field}
              />
            </FormControl>
            <FormDescription>Optional — up to 2,000 characters</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
