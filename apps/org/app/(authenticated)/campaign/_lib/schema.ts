import { z } from "zod";

export const campaignDraftSchema = z.object({
  name: z.string().min(1).max(200),
  goalCents: z.union([z.number().int().positive(), z.null()]).optional(),
  items: z.array(
    z.object({
      variantId: z.string().min(1),
      isFeatured: z.boolean().optional(),
    })
  ),
});

export type CampaignDraftInput = z.infer<typeof campaignDraftSchema>;
