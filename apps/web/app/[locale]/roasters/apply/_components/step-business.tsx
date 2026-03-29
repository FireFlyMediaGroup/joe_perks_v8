"use client";

import { Input } from "@repo/design-system/components/ui/input";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { ApplicationFormData } from "../_lib/schema";

interface StepBusinessProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepBusiness({ form }: StepBusinessProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Business details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
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
                placeholder="North Star Roasting Co."
                className="min-h-[44px]"
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
                type="url"
                placeholder="https://yourroastery.com"
                className="min-h-[44px]"
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
                placeholder="Tell us about your roastery, your story, and what makes your coffee special..."
                className="min-h-[100px]"
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
