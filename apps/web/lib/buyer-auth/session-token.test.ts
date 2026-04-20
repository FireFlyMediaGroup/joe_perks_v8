import { describe, expect, test } from "vitest";
import {
  createBuyerSessionToken,
  verifyBuyerSessionToken,
} from "./session-token";

const SECRET = "12345678901234567890123456789012";

describe("buyer session token helpers", () => {
  test("creates and verifies a signed session token", () => {
    const token = createBuyerSessionToken({
      buyerId: "buyer_123",
      now: 1_700_000_000,
      secret: SECRET,
    });

    expect(
      verifyBuyerSessionToken({
        now: 1_700_000_100,
        secret: SECRET,
        token,
      })
    ).toEqual({
      buyerId: "buyer_123",
      exp: 1_702_592_000,
      iat: 1_700_000_000,
    });
  });

  test("rejects a tampered token", () => {
    const token = createBuyerSessionToken({
      buyerId: "buyer_123",
      now: 1_700_000_000,
      secret: SECRET,
    });

    const [payload] = token.split(".");
    const tampered = `${payload}.invalid`;

    expect(
      verifyBuyerSessionToken({
        now: 1_700_000_100,
        secret: SECRET,
        token: tampered,
      })
    ).toBeNull();
  });

  test("rejects an expired token", () => {
    const token = createBuyerSessionToken({
      buyerId: "buyer_123",
      now: 1_700_000_000,
      secret: SECRET,
    });

    expect(
      verifyBuyerSessionToken({
        now: 1_702_592_001,
        secret: SECRET,
        token,
      })
    ).toBeNull();
  });
});
