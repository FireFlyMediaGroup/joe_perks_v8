import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  getBuyerAuthRequestIp,
  getGuestOrderLookupDetail,
  limitGuestOrderLookup,
} = vi.hoisted(() => ({
  getBuyerAuthRequestIp: vi.fn(),
  getGuestOrderLookupDetail: vi.fn(),
  limitGuestOrderLookup: vi.fn(),
}));

vi.mock("@joe-perks/stripe", () => ({
  limitGuestOrderLookup,
}));

vi.mock("../../../lib/buyer-auth/magic-link", () => ({
  getBuyerAuthRequestIp,
}));

vi.mock("./_lib/query", () => ({
  getGuestOrderLookupDetail,
}));

import { POST } from "./route";

describe("guest order lookup API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBuyerAuthRequestIp.mockReturnValue("127.0.0.1");
    limitGuestOrderLookup.mockResolvedValue({ success: true });
  });

  test("US-09-06: returns a generic failure when the order is not found", async () => {
    getGuestOrderLookupDetail.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/order-lookup", {
        body: JSON.stringify({
          email: "buyer@example.com",
          orderNumber: "JP-00042",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "We couldn't find an order with that email and order number.",
    });
  });

  test("US-09-06: returns 429 when the lookup IP is rate limited", async () => {
    limitGuestOrderLookup.mockResolvedValue({ success: false });

    const response = await POST(
      new Request("http://localhost/api/order-lookup", {
        body: JSON.stringify({
          email: "buyer@example.com",
          orderNumber: "JP-00042",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many lookup attempts. Please try again later.",
    });
    expect(getGuestOrderLookupDetail).not.toHaveBeenCalled();
  });

  test("US-09-06: normalizes email and order number before querying", async () => {
    getGuestOrderLookupDetail.mockResolvedValue({
      buyerEmail: "buyer@example.com",
      carrier: "UPS",
      deliveredAt: null,
      fulfillBy: new Date("2026-04-08T12:00:00.000Z"),
      fundraiserName: "Lincoln PTA",
      grossAmount: 3895,
      id: "ord_123",
      items: [],
      orderNumber: "JP-00042",
      orgAmount: 525,
      orgPctSnapshot: 15,
      placedAt: new Date("2026-04-05T12:00:00.000Z"),
      productSubtotal: 3295,
      shipToAddress1: "123 Roast St",
      shipToAddress2: null,
      shipToCity: "Nashville",
      shipToCountry: "US",
      shipToName: "Pat Buyer",
      shipToPostalCode: "37203",
      shipToState: "TN",
      shippedAt: new Date("2026-04-06T09:00:00.000Z"),
      shippingAmount: 600,
      status: "SHIPPED",
      trackingNumber: "1Z999AA10123456784",
    });

    const response = await POST(
      new Request("http://localhost/api/order-lookup", {
        body: JSON.stringify({
          email: "  Buyer@Example.com  ",
          orderNumber: "  jp-00042  ",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(getGuestOrderLookupDetail).toHaveBeenCalledWith({
      buyerEmail: "buyer@example.com",
      orderNumber: "JP-00042",
    });
    await expect(response.json()).resolves.toMatchObject({
      order: {
        buyerEmail: "buyer@example.com",
        orderNumber: "JP-00042",
      },
    });
  });
});
