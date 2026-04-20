import "server-only";

import { randomUUID } from "node:crypto";

import { database } from "./database";
import type { UserRole } from "./generated/client";

/** Pre-created users (US-02-02 admin approval) use this prefix until Clerk `user.created` links the real id. */
export const CLERK_PENDING_EXTERNAL_AUTH_PREFIX = "clerk_pending:";

export function isPendingClerkExternalAuthId(externalAuthId: string): boolean {
  return externalAuthId.startsWith(CLERK_PENDING_EXTERNAL_AUTH_PREFIX);
}

export function generatePendingClerkExternalAuthId(): string {
  return `${CLERK_PENDING_EXTERNAL_AUTH_PREFIX}${randomUUID()}`;
}

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

async function updateExistingByClerkId(
  userId: string,
  email: string,
  role: UserRole,
  roasterId: string | undefined,
  orgId: string | undefined
): Promise<void> {
  await database.user.update({
    where: { id: userId },
    data: {
      email,
      ...(role === "ROASTER_ADMIN" && roasterId !== undefined
        ? { roasterId }
        : {}),
      ...(role === "ORG_ADMIN" && orgId !== undefined ? { orgId } : {}),
    },
  });
}

async function mergePendingUserByEmail(
  existingId: string,
  clerkUserId: string,
  email: string,
  role: UserRole,
  roasterId: string | undefined,
  orgId: string | undefined,
  existingRoasterId: string | null,
  existingOrgId: string | null
): Promise<void> {
  await database.user.update({
    where: { id: existingId },
    data: {
      externalAuthId: clerkUserId,
      email,
      role,
      roasterId:
        role === "ROASTER_ADMIN" ? (roasterId ?? existingRoasterId) : null,
      orgId: role === "ORG_ADMIN" ? (orgId ?? existingOrgId) : null,
    },
  });
}

/**
 * Upserts `User` from Clerk `user.created` / `user.updated` webhook payloads.
 * `roasterId` / `orgId` come from `public_metadata` when present (`roasterId`, `orgId` keys).
 *
 * If a row was pre-created with {@link isPendingClerkExternalAuthId}, matches by email and
 * replaces `externalAuthId` with the Clerk user id so the roaster can sign in after approval.
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

  const existingByClerk = await database.user.findUnique({
    where: { externalAuthId: data.id },
  });
  if (existingByClerk) {
    await updateExistingByClerkId(
      existingByClerk.id,
      email,
      role,
      roasterId,
      orgId
    );
    return;
  }

  const existingByEmail = await database.user.findUnique({ where: { email } });
  if (
    existingByEmail &&
    isPendingClerkExternalAuthId(existingByEmail.externalAuthId)
  ) {
    await mergePendingUserByEmail(
      existingByEmail.id,
      data.id,
      email,
      role,
      roasterId,
      orgId,
      existingByEmail.roasterId,
      existingByEmail.orgId
    );
    return;
  }

  await database.user.create({
    data: {
      externalAuthId: data.id,
      email,
      role,
      roasterId: role === "ROASTER_ADMIN" ? (roasterId ?? null) : null,
      orgId: role === "ORG_ADMIN" ? (orgId ?? null) : null,
    },
  });
}
