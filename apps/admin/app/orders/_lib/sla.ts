import type { OrderStatus, PlatformSettings } from "@joe-perks/db";

type SlaBucket = "critical" | "on_track" | "warning";
type SlaPhase = SlaBucket | "inactive";
type SlaTone = "amber" | "green" | "grey" | "red";

type SlaSettings = Pick<
  PlatformSettings,
  "slaAutoRefundHours" | "slaBreachHours" | "slaCriticalHours" | "slaWarnHours"
>;

export interface OrderSlaState {
  autoRefundAt: Date;
  breachAt: Date;
  countsTowardSummary: boolean;
  criticalAt: Date;
  description: string;
  label: string;
  phase: SlaPhase;
  summaryBucket: SlaBucket | null;
  tone: SlaTone;
  warnAt: Date;
}

const HOUR_MS = 60 * 60 * 1000;

function hoursToMs(hours: number): number {
  return hours * HOUR_MS;
}

function inactiveSlaState(
  label: string,
  description: string,
  fulfillBy: Date,
  settings: SlaSettings
): OrderSlaState {
  return {
    ...getSlaThresholds(fulfillBy, settings),
    countsTowardSummary: false,
    description,
    label,
    phase: "inactive",
    summaryBucket: null,
    tone: "grey",
  };
}

function getSlaThresholds(fulfillBy: Date, settings: SlaSettings) {
  const breachAt = new Date(fulfillBy);
  const createdAtMs = breachAt.getTime() - hoursToMs(settings.slaBreachHours);

  return {
    autoRefundAt: new Date(
      createdAtMs + hoursToMs(settings.slaAutoRefundHours)
    ),
    breachAt,
    criticalAt: new Date(createdAtMs + hoursToMs(settings.slaCriticalHours)),
    warnAt: new Date(createdAtMs + hoursToMs(settings.slaWarnHours)),
  };
}

export function getOrderSlaState({
  adminAcknowledgedFlag = false,
  flaggedAt = null,
  flagResolvedAt = null,
  fulfillBy,
  now = new Date(),
  settings,
  status,
}: {
  adminAcknowledgedFlag?: boolean;
  flaggedAt?: Date | null;
  flagResolvedAt?: Date | null;
  fulfillBy: Date;
  now?: Date;
  settings: SlaSettings;
  status: OrderStatus;
}): OrderSlaState {
  const thresholds = getSlaThresholds(fulfillBy, settings);

  if (flaggedAt && !flagResolvedAt) {
    return {
      ...thresholds,
      countsTowardSummary: false,
      description: adminAcknowledgedFlag
        ? "Fulfillment issue acknowledged by admin. Manual follow-up is in progress."
        : "Fulfillment issue reported by the roaster. Automated SLA handling is paused.",
      label: adminAcknowledgedFlag ? "Flagged - acknowledged" : "Flagged",
      phase: "inactive",
      summaryBucket: null,
      tone: "red",
    };
  }

  if (status === "PENDING") {
    return inactiveSlaState(
      "Pending payment",
      "SLA starts after payment confirmation.",
      fulfillBy,
      settings
    );
  }

  if (status === "SHIPPED") {
    return inactiveSlaState(
      "Shipped",
      "Fulfillment SLA is no longer active after shipment.",
      fulfillBy,
      settings
    );
  }

  if (status === "DELIVERED") {
    return inactiveSlaState(
      "Delivered",
      "Fulfillment SLA is complete.",
      fulfillBy,
      settings
    );
  }

  if (status === "REFUNDED") {
    return inactiveSlaState(
      "Refunded",
      "Refunded orders are excluded from SLA monitoring.",
      fulfillBy,
      settings
    );
  }

  if (status === "CANCELLED") {
    return inactiveSlaState(
      "Cancelled",
      "Cancelled orders are excluded from SLA monitoring.",
      fulfillBy,
      settings
    );
  }

  if (now < thresholds.warnAt) {
    return {
      ...thresholds,
      countsTowardSummary: true,
      description: "Within the normal fulfillment window.",
      label: "On track",
      phase: "on_track",
      summaryBucket: "on_track",
      tone: "green",
    };
  }

  if (now < thresholds.breachAt) {
    return {
      ...thresholds,
      countsTowardSummary: true,
      description: "Approaching the SLA breach threshold.",
      label: "Warning",
      phase: "warning",
      summaryBucket: "warning",
      tone: "amber",
    };
  }

  return {
    ...thresholds,
    countsTowardSummary: true,
    description:
      now < thresholds.criticalAt
        ? "Past the SLA breach threshold."
        : "Past the critical SLA threshold.",
    label: now < thresholds.criticalAt ? "Breach" : "Critical",
    phase: "critical",
    summaryBucket: "critical",
    tone: "red",
  };
}
