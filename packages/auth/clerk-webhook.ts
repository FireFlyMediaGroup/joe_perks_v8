import "server-only";

import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";

export async function verifyClerkWebhook(
  req: Request,
  signingSecret: string
): Promise<WebhookEvent> {
  const payload = await req.text();
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");
  if (!(svix_id && svix_timestamp && svix_signature)) {
    throw new Error("Missing svix headers");
  }
  const wh = new Webhook(signingSecret);
  return wh.verify(payload, {
    "svix-id": svix_id,
    "svix-timestamp": svix_timestamp,
    "svix-signature": svix_signature,
  }) as WebhookEvent;
}
