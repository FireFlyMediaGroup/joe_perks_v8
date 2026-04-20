import "server-only";

import type { Prisma } from "./generated/client";

export const SUSPENSION_REASON_CATEGORIES = [
  "DISPUTES",
  "DEBT",
  "FULFILLMENT",
  "POLICY",
  "STRIPE",
  "OTHER",
] as const;

export type SuspensionReasonCategory =
  (typeof SUSPENSION_REASON_CATEGORIES)[number];

const SUSPENSION_REASON_LABELS: Record<SuspensionReasonCategory, string> = {
  DEBT: "Unsettled debt review",
  DISPUTES: "Dispute risk review",
  FULFILLMENT: "Fulfillment risk review",
  OTHER: "Account review",
  POLICY: "Policy review",
  STRIPE: "Stripe readiness review",
};

function readPayloadValue(
  payload: Prisma.JsonValue | null | undefined,
  key: string
): unknown {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  return key in payload ? payload[key] : null;
}

export function parseSuspensionReasonCategory(
  value: unknown
): SuspensionReasonCategory | null {
  if (typeof value !== "string") {
    return null;
  }

  return SUSPENSION_REASON_CATEGORIES.includes(
    value as SuspensionReasonCategory
  )
    ? (value as SuspensionReasonCategory)
    : null;
}

export function getSuspensionReasonLabel(
  category: SuspensionReasonCategory | null | undefined
): string {
  if (!category) {
    return SUSPENSION_REASON_LABELS.OTHER;
  }

  return SUSPENSION_REASON_LABELS[category];
}

export function getSuspensionReasonCategoryFromAction(input: {
  actionType: string;
  payload?: Prisma.JsonValue | null;
}): SuspensionReasonCategory | null {
  if (input.actionType === "ROASTER_AUTO_SUSPENDED") {
    return "DISPUTES";
  }

  return parseSuspensionReasonCategory(
    readPayloadValue(input.payload, "reasonCategory")
  );
}
