import { expect, test } from "vitest";

import {
  getOrderTimingLabel,
  parseOrderQueueView,
} from "../app/(authenticated)/dashboard/_lib/order-queue";

test("defaults unknown queue filters to to-ship", () => {
  expect(parseOrderQueueView(undefined)).toBe("to-ship");
  expect(parseOrderQueueView("unexpected")).toBe("to-ship");
  expect(parseOrderQueueView("shipped")).toBe("shipped");
});

test("formats confirmed-order timing with overdue and upcoming copy", () => {
  const now = new Date("2026-04-05T12:00:00.000Z");

  expect(
    getOrderTimingLabel(
      {
        deliveredAt: null,
        fulfillBy: new Date("2026-04-04T08:00:00.000Z"),
        shippedAt: null,
        status: "CONFIRMED",
      },
      now
    )
  ).toBe("Overdue since Apr 4");

  expect(
    getOrderTimingLabel(
      {
        deliveredAt: null,
        fulfillBy: new Date("2026-04-05T18:00:00.000Z"),
        shippedAt: null,
        status: "CONFIRMED",
      },
      now
    )
  ).toBe("Ship today");

  expect(
    getOrderTimingLabel(
      {
        deliveredAt: null,
        fulfillBy: new Date("2026-04-06T09:00:00.000Z"),
        shippedAt: null,
        status: "CONFIRMED",
      },
      now
    )
  ).toBe("Ship tomorrow");
});

test("formats shipped and delivered timing from their live timestamps", () => {
  expect(
    getOrderTimingLabel({
      deliveredAt: null,
      fulfillBy: new Date("2026-04-05T12:00:00.000Z"),
      shippedAt: new Date("2026-04-06T09:00:00.000Z"),
      status: "SHIPPED",
    })
  ).toBe("Shipped Apr 6");

  expect(
    getOrderTimingLabel({
      deliveredAt: new Date("2026-04-07T09:00:00.000Z"),
      fulfillBy: new Date("2026-04-05T12:00:00.000Z"),
      shippedAt: new Date("2026-04-06T09:00:00.000Z"),
      status: "DELIVERED",
    })
  ).toBe("Delivered Apr 7");
});
