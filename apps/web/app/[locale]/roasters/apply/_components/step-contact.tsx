"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import type { ApplicationFormData } from "../_lib/schema";

interface StepContactProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepContact({ form }: StepContactProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Contact information</h2>
        <p className="mt-1 text-muted-foreground text-sm">
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
                className="min-h-[44px]"
                placeholder="Jane Smith"
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
                className="min-h-[44px]"
                placeholder="jane@example.com"
                type="email"
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
                className="min-h-[44px]"
                placeholder="(555) 123-4567"
                type="tel"
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
