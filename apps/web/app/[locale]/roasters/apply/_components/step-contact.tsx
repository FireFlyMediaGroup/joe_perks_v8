"use client";

import { Input } from "@repo/design-system/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { ApplicationFormData } from "../_lib/schema";

interface StepContactProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepContact({ form }: StepContactProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Contact information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How can we reach you about your application?
        </p>
      </div>

      <FormField
        control={form.control}
        name="contactName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full name *</FormLabel>
            <FormControl>
              <Input
                placeholder="Jane Smith"
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
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email address *</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="jane@example.com"
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
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone number</FormLabel>
            <FormControl>
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                className="min-h-[44px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
