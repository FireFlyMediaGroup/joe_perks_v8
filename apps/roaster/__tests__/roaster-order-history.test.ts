import { expect, test } from "vitest";

import {
  getOrderEventActorLabel,
  getOrderEventDetail,
  getRoasterOrderEventLabel,
} from "../app/(authenticated)/orders/[id]/_lib/order-history";

test("maps live order events to roaster-facing labels", () => {
  expect(getRoasterOrderEventLabel("PAYMENT_SUCCEEDED")).toBe("Order confirmed");
  expect(getRoasterOrderEventLabel("FULFILLMENT_VIEWED")).toBe(
    "Fulfillment link opened"
  );
  expect(getRoasterOrderEventLabel("TRACKING_UPDATED")).toBe("Tracking updated");
});

test("maps actor types to friendly labels", () => {
  expect(getOrderEventActorLabel("ROASTER")).toBe("Roaster");
  expect(getOrderEventActorLabel("ADMIN")).toBe("Joe Perks");
  expect(getOrderEventActorLabel("SYSTEM")).toBe("System");
});

test("extracts shipment details from shipped and tracking-update payloads", () => {
  expect(
    getOrderEventDetail("SHIPPED", {
      carrier: "USPS",
      tracking_number: "9405511899562860000000",
    })
  ).toBe("USPS · 9405511899562860000000");

  expect(
    getOrderEventDetail("TRACKING_UPDATED", {
      carrier: "UPS",
      tracking_number: "1Z999AA10123456784",
    })
  ).toBe("UPS · 1Z999AA10123456784");
});
