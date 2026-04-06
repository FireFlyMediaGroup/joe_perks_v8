import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    $transaction: vi.fn(),
    magicLink: {
      findUnique: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("./database", () => ({
  database: mockDb,
}));

import { ensureActiveFulfillmentLink } from "./fulfillment-link";

describe("ensureActiveFulfillmentLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-06T12:00:00.000Z"));
  });

  it("reuses the current token when the link is still valid", async () => {
    mockDb.magicLink.findUnique.mockResolvedValue({
      expiresAt: new Date("2026-04-07T12:00:00.000Z"),
      purpose: "ORDER_FULFILLMENT",
      token: "active-token",
      usedAt: null,
    });

    const result = await ensureActiveFulfillmentLink({
      orderId: "order_1",
      regenerationReason: "sla_warning",
    });

    expect(result).toEqual({
      ok: true,
      regenerated: false,
      token: "active-token",
    });
    expect(mockDb.order.findUnique).not.toHaveBeenCalled();
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("regenerates the existing link in place when it is expired and the order is still confirmed", async () => {
    const createEvent = vi.fn().mockResolvedValue({});
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });

    mockDb.magicLink.findUnique.mockResolvedValueOnce({
      expiresAt: new Date("2026-04-06T11:59:59.000Z"),
      id: "link_1",
      purpose: "ORDER_FULFILLMENT",
      token: "expired-token",
      usedAt: null,
    });
    mockDb.order.findUnique.mockResolvedValue({
      id: "order_1",
      status: "CONFIRMED",
    });
    mockDb.$transaction.mockImplementation(async (callback) =>
      callback({
        magicLink: {
          updateMany,
        },
        orderEvent: {
          create: createEvent,
        },
      })
    );

    const result = await ensureActiveFulfillmentLink({
      orderId: "order_1",
      regenerationReason: "sla_breach",
    });

    expect(result.ok).toBe(true);
    expect(result).toMatchObject({
      ok: true,
      regenerated: true,
    });
    expect(updateMany).toHaveBeenCalledOnce();
    expect(createEvent).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorType: "SYSTEM",
        eventType: "MAGIC_LINK_RESENT",
        orderId: "order_1",
        payload: { reason: "sla_breach" },
      }),
    });
  });

  it("rejects expired regeneration when the order is no longer awaiting shipment", async () => {
    mockDb.magicLink.findUnique.mockResolvedValue({
      expiresAt: new Date("2026-04-06T11:59:59.000Z"),
      id: "link_1",
      purpose: "ORDER_FULFILLMENT",
      token: "expired-token",
      usedAt: null,
    });
    mockDb.order.findUnique.mockResolvedValue({
      id: "order_1",
      status: "SHIPPED",
    });

    const result = await ensureActiveFulfillmentLink({
      orderId: "order_1",
      regenerationReason: "expired_token_recovery",
      requireExpired: true,
    });

    expect(result).toEqual({
      ok: false,
      reason: "not_pending",
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });
});
