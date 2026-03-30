import { z } from "zod";

export const ROAST_LEVELS = ["LIGHT", "MEDIUM", "MEDIUM_DARK", "DARK"] as const;

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const GRIND_OPTIONS = [
  "WHOLE_BEAN",
  "GROUND_DRIP",
  "GROUND_ESPRESSO",
  "GROUND_FRENCH_PRESS",
] as const;

const IMAGE_URL_HTTP_PREFIX = /^https?:\/\//i;

function emptyToUndefined(s: string | undefined): string | undefined {
  if (s === undefined) {
    return;
  }
  const t = s.trim();
  return t === "" ? undefined : t;
}

export const productFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    description: z.string().max(5000).optional(),
    origin: z.string().max(200).optional(),
    imageUrl: z.string().optional(),
    roastLevel: z.enum(ROAST_LEVELS),
    status: z.enum(PRODUCT_STATUSES),
  })
  .transform((data) => ({
    ...data,
    description: emptyToUndefined(data.description),
    origin: emptyToUndefined(data.origin),
    imageUrl: emptyToUndefined(data.imageUrl),
  }))
  .refine((d) => !d.imageUrl || IMAGE_URL_HTTP_PREFIX.test(d.imageUrl), {
    message: "Image must be a valid http(s) URL",
    path: ["imageUrl"],
  });

export type ProductFormInput = z.infer<typeof productFormSchema>;

const variantFields = z.object({
  sizeOz: z.coerce.number().int().min(1).max(9999),
  grind: z.enum(GRIND_OPTIONS),
  wholesalePriceCents: z.number().int().positive(),
  retailPriceCents: z.number().int().positive(),
  sku: z.string().max(100).optional(),
  isAvailable: z.boolean(),
});

const variantWithPriceRefine = variantFields
  .transform((data) => ({
    ...data,
    sku: emptyToUndefined(data.sku),
  }))
  .refine((d) => d.retailPriceCents > d.wholesalePriceCents, {
    message: "Retail price must be greater than wholesale price",
    path: ["retailPriceCents"],
  });

export const variantFormSchema = variantWithPriceRefine;

export type VariantFormInput = z.infer<typeof variantFormSchema>;

export const createVariantInputSchema = variantFields
  .merge(z.object({ productId: z.string().min(1) }))
  .transform((data) => ({
    ...data,
    sku: emptyToUndefined(data.sku),
  }))
  .refine((d) => d.retailPriceCents > d.wholesalePriceCents, {
    message: "Retail price must be greater than wholesale price",
    path: ["retailPriceCents"],
  });

export const updateVariantInputSchema = variantFields
  .merge(
    z.object({
      id: z.string().min(1),
      productId: z.string().min(1),
    })
  )
  .transform((data) => ({
    ...data,
    sku: emptyToUndefined(data.sku),
  }))
  .refine((d) => d.retailPriceCents > d.wholesalePriceCents, {
    message: "Retail price must be greater than wholesale price",
    path: ["retailPriceCents"],
  });
