import { expect, test } from "vitest";

import { getOrderSlaState } from "../app/(authenticated)/orders/_lib/sla";

const HOUR_MS = 60 * 60 * 1000;

const baseSettings = {
  slaAutoRefundHours: 96,
  slaBreachHours: 48,
  slaCriticalHours: 72,
  slaWarnHours: 24,
} as const;

test("US-07-01: confirmed order before warn threshold is on track with SLA summary bucket", () => {
  const fulfillBy = new Date(2_000_000_000_000 + 48 * HOUR_MS);
  const createdAtMs = fulfillBy.getTime() - 48 * HOUR_MS;
  const now = new Date(createdAtMs + 1 * HOUR_MS);

  const state = getOrderSlaState({
    fulfillBy,
    now,
    settings: baseSettings,
    status: "CONFIRMED",
  });

  expect(state.phase).toBe("on_track");
  expect(state.summaryBucket).toBe("on_track");
  expect(state.tone).toBe("green");
  expect(state.countsTowardSummary).toBe(true);
});

test("US-07-01: shipped order is inactive for SLA rollups", () => {
  const fulfillBy = new Date();
  const state = getOrderSlaState({
    fulfillBy,
    now: new Date(),
    settings: baseSettings,
    status: "SHIPPED",
  });

  expect(state.phase).toBe("inactive");
  expect(state.summaryBucket).toBeNull();
  expect(state.countsTowardSummary).toBe(false);
});
