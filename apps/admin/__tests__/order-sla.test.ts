import { describe, expect, test } from "vitest";

import { getOrderSlaState } from "../app/orders/_lib/sla";

const settings = {
  slaAutoRefundHours: 96,
  slaBreachHours: 48,
  slaCriticalHours: 72,
  slaWarnHours: 24,
};

describe("getOrderSlaState", () => {
  test("pauses SLA summary buckets for unresolved flagged orders", () => {
    const state = getOrderSlaState({
      adminAcknowledgedFlag: false,
      flaggedAt: new Date("2026-04-06T12:00:00.000Z"),
      flagResolvedAt: null,
      fulfillBy: new Date("2026-04-07T12:00:00.000Z"),
      now: new Date("2026-04-07T13:00:00.000Z"),
      settings,
      status: "CONFIRMED",
    });

    expect(state.phase).toBe("inactive");
    expect(state.label).toBe("Flagged");
    expect(state.countsTowardSummary).toBe(false);
    expect(state.summaryBucket).toBeNull();
  });

  test("returns to normal SLA evaluation after a flag is resolved", () => {
    const state = getOrderSlaState({
      adminAcknowledgedFlag: true,
      flaggedAt: new Date("2026-04-06T12:00:00.000Z"),
      flagResolvedAt: new Date("2026-04-06T14:00:00.000Z"),
      fulfillBy: new Date("2026-04-07T12:00:00.000Z"),
      now: new Date("2026-04-07T13:00:00.000Z"),
      settings,
      status: "CONFIRMED",
    });

    expect(state.phase).toBe("critical");
    expect(state.countsTowardSummary).toBe(true);
    expect(state.summaryBucket).toBe("critical");
  });
});
