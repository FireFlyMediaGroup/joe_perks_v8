"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";
import type { ApplicationFormData } from "../_lib/schema";

interface StepCoffeeProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepCoffee({ form }: StepCoffeeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">About your coffee</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Help us understand what you roast and how you operate. This
          information helps our team evaluate your application.
        </p>
      </div>

      <FormField
        control={form.control}
        name="coffeeInfo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Roast styles &amp; production capacity</FormLabel>
            <FormControl>
              <Textarea
                className="min-h-[160px]"
                placeholder={
                  "For example:\n" +
                  "• We specialize in single-origin light and medium roasts\n" +
                  "• We roast 500 lbs/week on a Probat P25\n" +
                  "• We source from direct-trade farms in Colombia and Ethiopia"
                }
                {...field}
              />
            </FormControl>
            <FormDescription>
              Optional — describe your roast profiles, specialties, sourcing,
              and production capacity
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
