import { z } from "zod";

export const checkoutSchema = z.object({
  campaignId: z.string().min(1),
  items: z
    .array(
      z.object({
        campaignItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  buyerEmail: z.string().trim().email(),
  buyerName: z.string().trim().min(1).max(200),
  street: z.string().trim().min(1).max(200),
  street2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(50),
  zip: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).default("US"),
  shippingRateId: z.string().min(1),
});

export type CheckoutRequestBody = z.infer<typeof checkoutSchema>;

export function buildOrderSnapshotData(body: CheckoutRequestBody) {
  const shipToAddress2 = body.street2?.trim();

  return {
    buyerEmail: body.buyerEmail,
    shipToAddress1: body.street,
    shipToAddress2: shipToAddress2 ? shipToAddress2 : null,
    shipToCity: body.city,
    shipToCountry: body.country.toUpperCase(),
    shipToName: body.buyerName,
    shipToPostalCode: body.zip,
    shipToState: body.state,
  };
}
