import { createElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import { PayoutsDashboard } from "../app/(authenticated)/payouts/_components/payouts-dashboard";
import {
  getPayoutDisplayState,
  getPayoutEventNote,
  summarizeFinanceData,
} from "../app/(authenticated)/payouts/_lib/payouts";
import type { RoasterPayoutsPageData } from "../app/(authenticated)/payouts/_lib/queries";

test("maps held payouts into hold-period and awaiting-release states", () => {
  const now = new Date("2026-04-06T12:00:00.000Z");

  expect(
    getPayoutDisplayState("HELD", new Date("2026-04-07T09:00:00.000Z"), now)
  ).toBe("in-hold");

  expect(
    getPayoutDisplayState("HELD", new Date("2026-04-05T09:00:00.000Z"), now)
  ).toBe("awaiting-release");

  expect(getPayoutDisplayState("TRANSFERRED", null, now)).toBe("paid");
  expect(getPayoutDisplayState("FAILED", null, now)).toBe("failed");
});

test("summarizes payout, debt, and dispute totals for the dashboard cards", () => {
  const now = new Date("2026-04-06T12:00:00.000Z");

  const summary = summarizeFinanceData(
    [
      {
        payoutEligibleAt: new Date("2026-04-07T09:00:00.000Z"),
        payoutStatus: "HELD",
        roasterTotal: 3200,
      },
      {
        payoutEligibleAt: new Date("2026-04-05T09:00:00.000Z"),
        payoutStatus: "HELD",
        roasterTotal: 4100,
      },
      {
        payoutEligibleAt: new Date("2026-04-04T09:00:00.000Z"),
        payoutStatus: "TRANSFERRED",
        roasterTotal: 5600,
      },
      {
        payoutEligibleAt: new Date("2026-04-04T09:00:00.000Z"),
        payoutStatus: "FAILED",
        roasterTotal: 1800,
      },
    ],
    [{ amount: 900 }, { amount: 600 }],
    [{ outcome: null }, { outcome: "LOST" }],
    now
  );

  expect(summary.inHold).toEqual({ amount: 3200, count: 1 });
  expect(summary.awaitingRelease).toEqual({ amount: 4100, count: 1 });
  expect(summary.paid).toEqual({ amount: 5600, count: 1 });
  expect(summary.failed).toEqual({ amount: 1800, count: 1 });
  expect(summary.unsettledDebtTotal).toBe(1500);
  expect(summary.unsettledDebtCount).toBe(2);
  expect(summary.openDisputes).toBe(1);
});

test("surfaces debt-aware and setup-aware payout event notes", () => {
  expect(
    getPayoutEventNote({
      eventType: "PAYOUT_TRANSFERRED",
      payload: { total_debt: 1250 },
    })
  ).toContain("$12.50");

  expect(
    getPayoutEventNote({
      eventType: "PAYOUT_FAILED",
      payload: { reason: "roaster_debt_exceeds_payout" },
    })
  ).toContain("exceeded this payout");

  expect(
    getPayoutEventNote({
      eventType: "PAYOUT_FAILED",
      payload: { reason: "roaster_connect_not_ready" },
    })
  ).toContain("payouts are enabled");
});

test("renders dispute payout labels from live payout eligibility", () => {
  const baseData: RoasterPayoutsPageData = {
    account: {
      businessName: "North Star Coffee",
      chargesEnabled: true,
      payoutsEnabled: true,
      status: "ACTIVE",
      stripeOnboarding: "COMPLETE",
    },
    debts: [],
    disputes: [
      {
        createdAt: new Date("2026-04-06T12:00:00.000Z"),
        faultAttribution: "ROASTER",
        id: "dispute_1",
        order: {
          id: "order_1",
          orderNumber: "JP-00091",
          payoutEligibleAt: new Date("2026-04-05T09:00:00.000Z"),
          payoutStatus: "HELD",
          roasterTotal: 4200,
        },
        outcome: null,
        respondBy: null,
        stripeDisputeId: "dp_123",
      },
    ],
    payouts: [],
  };

  const { rerender } = render(createElement(PayoutsDashboard, { data: baseData }));
  const disputesSectionHeading = screen.getByText("Disputes");
  const disputesSection = disputesSectionHeading.closest("section");
  expect(disputesSection).toBeTruthy();
  expect(within(disputesSection as HTMLElement).getByText("Awaiting release")).toBeDefined();

  rerender(
    createElement(PayoutsDashboard, {
      data: {
        ...baseData,
        disputes: [
          {
            ...baseData.disputes[0],
            id: "dispute_2",
            order: {
              ...baseData.disputes[0].order,
              payoutEligibleAt: new Date("2026-04-07T09:00:00.000Z"),
            },
            stripeDisputeId: "dp_456",
          },
        ],
      },
    })
  );

  const nextDisputesSection = screen.getByText("Disputes").closest("section");
  expect(nextDisputesSection).toBeTruthy();
  expect(within(nextDisputesSection as HTMLElement).getByText("In hold period")).toBeDefined();
});
