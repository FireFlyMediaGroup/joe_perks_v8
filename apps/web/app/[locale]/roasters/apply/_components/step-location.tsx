"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import type { UseFormReturn } from "react-hook-form";
import { type ApplicationFormData, US_STATES } from "../_lib/schema";

interface StepLocationProps {
  form: UseFormReturn<ApplicationFormData>;
}

export function StepLocation({ form }: StepLocationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Roastery location</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Where is your roastery based?
        </p>
      </div>

      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City *</FormLabel>
            <FormControl>
              <Input
                className="min-h-[44px]"
                placeholder="Portland"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="min-h-[44px] w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {US_STATES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
