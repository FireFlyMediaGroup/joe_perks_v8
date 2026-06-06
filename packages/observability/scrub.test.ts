import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { scrubEvent } from "./scrub";

describe("scrubEvent", () => {
  it("reduces event.user to an opaque id", () => {
    const out = scrubEvent({
      user: {
        id: "user_123",
        email: "buyer@example.com",
        ip_address: "203.0.113.7",
        username: "Jane Buyer",
      },
    } as ErrorEvent);
    expect(out.user).toEqual({ id: "user_123" });
  });

  it("redacts inline emails in the message and exception value", () => {
    const out = scrubEvent({
      message: "checkout failed for buyer@example.com",
      exception: {
        values: [{ type: "Error", value: "no buyer jane@roaster.io found" }],
      },
    } as ErrorEvent);
    expect(out.message).not.toContain("@example.com");
    expect(out.message).toBe("checkout failed for [redacted]");
    expect(out.exception?.values?.[0].value).toBe("no buyer [redacted] found");
  });

  it("strips sensitive headers and cookies from the request", () => {
    const out = scrubEvent({
      request: {
        cookies: { session: "abc" },
        headers: {
          authorization: "Bearer secret",
          "stripe-signature": "t=1,v1=deadbeef",
          "content-type": "application/json",
        },
        query_string: "email=buyer@example.com&campaign=fall",
      },
    } as unknown as ErrorEvent);
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.headers?.authorization).toBe("[redacted]");
    expect(out.request?.headers?.["stripe-signature"]).toBe("[redacted]");
    expect(out.request?.headers?.["content-type"]).toBe("application/json");
    expect(out.request?.query_string).toBe("email=[redacted]&campaign=fall");
  });

  it("redacts PII-keyed values anywhere in the request body", () => {
    const out = scrubEvent({
      request: {
        data: {
          buyerName: "Jane Buyer",
          // A PII-keyed object is redacted wholesale (no need to recurse).
          shippingAddress: { line1: "1 Main St", postalCode: "90210" },
          campaignId: "camp_1",
          // Recurse into non-PII containers and redact PII keys found inside.
          metadata: { line1: "1 Main St", note: "leave at door" },
          items: [{ productName: "Ethiopia", qty: 2 }],
        },
      },
    } as unknown as ErrorEvent);
    const data = out.request?.data as Record<string, unknown>;
    expect(data.buyerName).toBe("[redacted]");
    expect(data.campaignId).toBe("camp_1");
    expect(data.shippingAddress).toBe("[redacted]");
    const meta = data.metadata as Record<string, unknown>;
    expect(meta.line1).toBe("[redacted]");
    expect(meta.note).toBe("leave at door");
    const items = data.items as Record<string, unknown>[];
    expect(items[0].productName).toBe("[redacted]");
    expect(items[0].qty).toBe(2);
  });

  it("scrubs captured local variables in stack frames", () => {
    const out = scrubEvent({
      exception: {
        values: [
          {
            type: "Error",
            value: "boom",
            stacktrace: {
              frames: [
                {
                  function: "POST",
                  vars: { buyerEmail: "buyer@example.com", orderId: "ord_1" },
                },
              ],
            },
          },
        ],
      },
    } as unknown as ErrorEvent);
    const vars = out.exception?.values?.[0].stacktrace?.frames?.[0].vars as
      | Record<string, unknown>
      | undefined;
    expect(vars?.buyerEmail).toBe("[redacted]");
    expect(vars?.orderId).toBe("ord_1");
  });

  it("does not throw on cyclic extra data", () => {
    const cyclic: Record<string, unknown> = { name: "Jane" };
    cyclic.self = cyclic;
    expect(() =>
      scrubEvent({ extra: cyclic } as unknown as ErrorEvent)
    ).not.toThrow();
  });
});
