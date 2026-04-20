import { z } from "zod";

const payloadSchema = z.object({
  applicationId: z.string().min(1),
  roasterId: z.string().min(1),
  orgName: z.string().optional(),
});

export type RoasterReviewPayload = z.infer<typeof payloadSchema>;

export function parseRoasterReviewPayload(
  payload: unknown
): RoasterReviewPayload | null {
  const parsed = payloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}
