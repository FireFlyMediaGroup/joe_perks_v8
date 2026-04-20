import "server-only";

import { database } from "./database";
import type { Prisma } from "./generated/client";

export type AdminActionType =
  | "DISPUTE_FAULT_ATTRIBUTED"
  | "ORDER_MARKED_DELIVERED"
  | "ORG_REACTIVATED"
  | "ORG_REACTIVATION_REQUESTED"
  | "ORG_SUSPENDED"
  | "PLATFORM_SETTINGS_UPDATED"
  | "ROASTER_AUTO_SUSPENDED"
  | "ROASTER_REACTIVATED"
  | "ROASTER_REACTIVATION_REQUESTED"
  | "ROASTER_SUSPENDED";

export type AdminActionTargetType =
  | "DISPUTE"
  | "ORDER"
  | "ORG"
  | "PLATFORM_SETTINGS"
  | "ROASTER";

export interface LogAdminActionInput {
  actionType: AdminActionType | (string & {});
  actorLabel: string;
  note?: string | null;
  payload?: Prisma.InputJsonValue | null;
  targetId: string;
  targetType: AdminActionTargetType | (string & {});
}

export function logAdminAction({
  actionType,
  actorLabel,
  note,
  payload,
  targetId,
  targetType,
}: LogAdminActionInput) {
  const normalizedActorLabel = actorLabel.trim();
  const normalizedTargetId = targetId.trim();
  const normalizedNote = note?.trim();

  if (!normalizedActorLabel) {
    throw new Error("logAdminAction requires a non-empty actorLabel");
  }

  if (!normalizedTargetId) {
    throw new Error("logAdminAction requires a non-empty targetId");
  }

  return database.adminActionLog.create({
    data: {
      actionType,
      actorLabel: normalizedActorLabel,
      ...(normalizedNote ? { note: normalizedNote } : {}),
      ...(payload != null ? { payload } : {}),
      targetId: normalizedTargetId,
      targetType,
    },
  });
}
