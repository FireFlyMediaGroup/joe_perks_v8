import { upsertUserFromClerkWebhook } from "@joe-perks/db";
import { verifyClerkWebhook } from "@repo/auth/clerk-webhook";
import type { WebhookEvent } from "@repo/auth/server";
import { env } from "@/env";

function isUserEvent(evt: WebhookEvent): evt is WebhookEvent & {
  type: "user.created" | "user.updated";
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string | null;
    public_metadata?: Record<string, unknown> | null;
  };
} {
  return evt.type === "user.created" || evt.type === "user.updated";
}

export async function POST(req: Request) {
  const secret = env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "CLERK_WEBHOOK_SECRET is not configured" },
      { status: 503 }
    );
  }

  let evt: WebhookEvent;
  try {
    evt = await verifyClerkWebhook(req, secret);
  } catch {
    return Response.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  if (isUserEvent(evt)) {
    await upsertUserFromClerkWebhook(evt.data, "ROASTER_ADMIN");
  }

  return Response.json({ received: true });
}
