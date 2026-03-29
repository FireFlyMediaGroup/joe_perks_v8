import "server-only";

import { database } from "./database";
import type { UserRole } from "./generated/client";

interface ClerkUserPayload {
  email_addresses: { email_address: string; id: string }[];
  id: string;
  primary_email_address_id: string | null;
  public_metadata?: Record<string, unknown> | null;
}

function primaryEmail(data: ClerkUserPayload): string | undefined {
  const primary = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );
  return primary?.email_address ?? data.email_addresses[0]?.email_address;
}

/**
 * Upserts `User` from Clerk `user.created` / `user.updated` webhook payloads.
 * `roasterId` / `orgId` come from `public_metadata` when present (`roasterId`, `orgId` keys).
 */
export async function upsertUserFromClerkWebhook(
  data: ClerkUserPayload,
  role: UserRole
): Promise<void> {
  const email = primaryEmail(data);
  if (!email) {
    throw new Error("Clerk user has no email");
  }

  const meta = data.public_metadata ?? {};
  const roasterId =
    typeof meta.roasterId === "string" ? meta.roasterId : undefined;
  const orgId = typeof meta.orgId === "string" ? meta.orgId : undefined;

  await database.user.upsert({
    where: { externalAuthId: data.id },
    create: {
      externalAuthId: data.id,
      email,
      role,
      roasterId: role === "ROASTER_ADMIN" ? (roasterId ?? null) : null,
      orgId: role === "ORG_ADMIN" ? (orgId ?? null) : null,
    },
    update: {
      email,
      ...(role === "ROASTER_ADMIN" && roasterId !== undefined
        ? { roasterId }
        : {}),
      ...(role === "ORG_ADMIN" && orgId !== undefined ? { orgId } : {}),
    },
  });
}
