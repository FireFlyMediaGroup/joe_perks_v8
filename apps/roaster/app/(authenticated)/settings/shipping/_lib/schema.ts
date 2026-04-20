import { z } from "zod";

/** Validated shipping rate fields after dollar string → cents conversion in server actions. */
export const shippingRateFieldsSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(200),
  carrier: z.string().trim().min(1, "Carrier is required").max(100),
  flatRateCents: z
    .number()
    .int()
    .positive("Flat rate must be greater than zero"),
  isDefault: z.boolean(),
});

export type ShippingRateFields = z.infer<typeof shippingRateFieldsSchema>;
