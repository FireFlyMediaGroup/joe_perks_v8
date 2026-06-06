import { beforeEach, describe, expect, it, vi } from "vitest";

// `payment-log` resolves the backing logger from `./log`, which is `console` in
// dev/test but Logtail when NODE_ENV=production (e.g. on Vercel builds). Mock it
// so the assertions are independent of the environment the suite runs in.
const mockLog = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("./log", () => ({ log: mockLog }));

import { createPaymentLog } from "./payment-log";

describe("createPaymentLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always emits the four canonical context keys", () => {
    const plog = createPaymentLog({
      orderId: "ord_1",
      orderNumber: "JP-00001",
      orgId: "org_1",
      roasterId: "roaster_1",
    });

    plog.error("payout failed");

    expect(mockLog.error).toHaveBeenCalledWith("payout failed", {
      order_id: "ord_1",
      order_number: "JP-00001",
      org_id: "org_1",
      roaster_id: "roaster_1",
    });
  });

  it("defaults missing context fields to null (keys still present)", () => {
    const plog = createPaymentLog({ orderId: "ord_1" });

    plog.info("payment succeeded");

    expect(mockLog.info).toHaveBeenCalledWith("payment succeeded", {
      order_id: "ord_1",
      order_number: null,
      org_id: null,
      roaster_id: null,
    });
  });

  it("merges per-call extra fields over the canonical context", () => {
    const plog = createPaymentLog({ orderId: "ord_1", roasterId: "roaster_1" });

    plog.warn("transfer retry", { attempt: 2, stage: "roaster_transfer" });

    expect(mockLog.warn).toHaveBeenCalledWith("transfer retry", {
      attempt: 2,
      order_id: "ord_1",
      order_number: null,
      org_id: null,
      roaster_id: "roaster_1",
      stage: "roaster_transfer",
    });
  });
});
