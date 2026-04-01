import { z } from "zod";

export const shippingFormSchema = z.object({
  buyerName: z.string().min(1, "Name is required").max(200),
  buyerEmail: z.string().email("Enter a valid email"),
  street: z.string().min(1, "Street address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(50),
  zip: z.string().min(3, "ZIP / postal code is required").max(20),
  shippingRateId: z.string().min(1, "Select a shipping option"),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;
