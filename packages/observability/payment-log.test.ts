import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPaymentLog } from "./payment-log";

// NODE_ENV !== "production" in tests, so `log` resolves to `console`.
describe("createPaymentLog", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("always emits the four canonical context keys", () => {
    const plog = createPaymentLog({
      orderId: "ord_1",
      orderNumber: "JP-00001",
      orgId: "org_1",
      roasterId: "roaster_1",
    });

    plog.error("payout failed");

    expect(console.error).toHaveBeenCalledWith("payout failed", {
      order_id: "ord_1",
      order_number: "JP-00001",
      org_id: "org_1",
      roaster_id: "roaster_1",
    });
  });

  it("defaults missing context fields to null (keys still present)", () => {
    const plog = createPaymentLog({ orderId: "ord_1" });

    plog.info("payment succeeded");

    expect(console.info).toHaveBeenCalledWith("payment succeeded", {
      order_id: "ord_1",
      order_number: null,
      org_id: null,
      roaster_id: null,
    });
  });

  it("merges per-call extra fields over the canonical context", () => {
    const plog = createPaymentLog({ orderId: "ord_1", roasterId: "roaster_1" });

    plog.warn("transfer retry", { attempt: 2, stage: "roaster_transfer" });

    expect(console.warn).toHaveBeenCalledWith("transfer retry", {
      attempt: 2,
      order_id: "ord_1",
      order_number: null,
      org_id: null,
      roaster_id: "roaster_1",
      stage: "roaster_transfer",
    });
  });
});
