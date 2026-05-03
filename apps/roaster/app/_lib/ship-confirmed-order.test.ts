import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  database: {
    $transaction: vi.fn(),
    order: {
      findUnique: vi.fn(),
    },
  },
  sendEmail: vi.fn(),
  tx: {
    magicLink: {
      updateMany: vi.fn(),
    },
    order: {
      updateMany: vi.fn(),
    },
    orderEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@joe-perks/db", () => ({
  database: mocks.database,
}));

vi.mock("@joe-perks/email/send", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@joe-perks/email/templates/order-shipped", () => ({
  default() {
    return null;
  },
}));

import { shipConfirmedOrder } from "./ship-confirmed-order";

describe("shipConfirmedOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.database.$transaction.mockImplementation(async (callback) =>
      callback(mocks.tx)
    );
    mocks.tx.magicLink.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.order.updateMany.mockResolvedValue({ count: 1 });
    mocks.tx.orderEvent.create.mockResolvedValue({});
    mocks.database.order.findUnique.mockResolvedValue({
      id: "order_1",
      buyer: { email: "buyer@example.com", name: "Buyer" },
      campaign: {
        org: {
          application: { orgName: "School PTA" },
          slug: "school-pta",
        },
      },
      orderNumber: "JP-00001",
    });
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  test("ships with a single conditional order update", async () => {
    await expect(
      shipConfirmedOrder({
        carrier: "UPS",
        orderId: "order_1",
        roasterId: "roaster_1",
        trackingNumber: "1Z999",
      })
    ).resolves.toEqual({ ok: true });

    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: "order_1", roasterId: "roaster_1", status: "CONFIRMED" },
      data: {
        carrier: "UPS",
        shippedAt: expect.any(Date),
        status: "SHIPPED",
        trackingNumber: "1Z999",
      },
    });
    expect(mocks.tx.orderEvent.create).toHaveBeenCalledWith({
      data: {
        actorId: "roaster_1",
        actorType: "ROASTER",
        eventType: "SHIPPED",
        orderId: "order_1",
        payload: {
          carrier: "UPS",
          tracking_number: "1Z999",
        },
      },
    });
  });

  test("does not create an event or send email when the order was already shipped", async () => {
    mocks.tx.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      shipConfirmedOrder({
        carrier: "UPS",
        orderId: "order_1",
        roasterId: "roaster_1",
        trackingNumber: "1Z999",
      })
    ).resolves.toEqual({
      ok: false,
      error:
        "This order was already shipped, is still awaiting payment, or the fulfillment link is no longer valid.",
    });

    expect(mocks.tx.orderEvent.create).not.toHaveBeenCalled();
    expect(mocks.database.order.findUnique).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
