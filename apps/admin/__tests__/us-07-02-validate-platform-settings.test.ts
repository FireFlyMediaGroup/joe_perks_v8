import { expect, test } from "vitest";

import { validatePlatformSettingsForm } from "../app/settings/_lib/validate-platform-settings";

function formWithAck(entries: Record<string, string>): FormData {
  const fd = new FormData();
  fd.set("ackFutureImpact", "on");
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

const validBaseline = {
  disputeFeeDollars: "15.00",
  orgPctDefaultPercent: "15",
  orgPctMaxPercent: "25",
  orgPctMinPercent: "5",
  payoutHoldDays: "7",
  platformFeeFloorDollars: "1.00",
  platformFeePctPercent: "5",
  slaAutoRefundHours: "96",
  slaBreachHours: "48",
  slaCriticalHours: "72",
  slaWarnHours: "24",
} as const;

test("US-07-02: valid form passes with acknowledgment", () => {
  const result = validatePlatformSettingsForm(
    formWithAck({ ...validBaseline })
  );
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.values.platformFeePct).toBeCloseTo(0.05, 6);
    expect(result.values.platformFeeFloor).toBe(100);
    expect(result.values.disputeFeeCents).toBe(1500);
  }
});

test("US-07-02: missing acknowledgment fails", () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validBaseline)) {
    fd.set(k, v);
  }
  const result = validatePlatformSettingsForm(fd);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  }
});

test("US-07-02: org min greater than max fails", () => {
  const result = validatePlatformSettingsForm(
    formWithAck({
      ...validBaseline,
      orgPctMaxPercent: "10",
      orgPctMinPercent: "20",
    })
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.some((e) => e.includes("minimum"))).toBe(true);
  }
});

test("US-07-02: SLA reminder must be strictly less than breach window", () => {
  const result = validatePlatformSettingsForm(
    formWithAck({
      ...validBaseline,
      slaBreachHours: "24",
      slaWarnHours: "24",
    })
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.some((e) => e.includes("strictly less"))).toBe(true);
  }
});
