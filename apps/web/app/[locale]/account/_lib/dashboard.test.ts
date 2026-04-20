import { describe, expect, test } from "vitest";
import {
  buildBuyerDashboardSummary,
  getBuyerOrderStatusCopy,
  type BuyerDashboardOrder,
} from "./dashboard";

const ORDERS: BuyerDashboardOrder[] = [
  {
    fundraiserName: "Lincoln PTA",
    id: "ord_1",
    impactCents: 525,
    orderNumber: "JP-00021",
    placedAt: new Date("2026-04-05T12:00:00.000Z"),
    status: "SHIPPED",
    totalCents: 3895,
    unitsCount: 2,
  },
  {
    fundraiserName: "City Soccer Club",
    id: "ord_2",
    impactCents: 900,
    orderNumber: "JP-00018",
    placedAt: new Date("2026-03-29T12:00:00.000Z"),
    status: "DELIVERED",
    totalCents: 5400,
    unitsCount: 3,
  },
];

describe("buyer dashboard helpers", () => {
  test("builds impact summary totals from frozen order values", () => {
    expect(buildBuyerDashboardSummary(ORDERS)).toEqual({
      orderCount: 2,
      totalImpactCents: 1425,
      totalSpentCents: 9295,
    });
  });

  test("maps pending orders to buyer-friendly copy", () => {
    expect(getBuyerOrderStatusCopy("PENDING")).toMatchObject({
      description: "We're finalizing your payment.",
      label: "Payment processing",
    });
  });
});
