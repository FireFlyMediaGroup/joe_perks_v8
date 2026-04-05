import { describe, expect, test } from "vitest";
import {
  buildBuyerSignInPath,
  sanitizeBuyerRedirect,
} from "./redirect";

describe("buyer auth redirect helpers", () => {
  test("keeps same-locale redirects", () => {
    expect(sanitizeBuyerRedirect("en", "/en/account/orders/ord_123")).toBe(
      "/en/account/orders/ord_123"
    );
  });

  test("prefixes locale onto internal redirects without one", () => {
    expect(sanitizeBuyerRedirect("en", "/account/orders/ord_123")).toBe(
      "/en/account/orders/ord_123"
    );
  });

  test("rejects absolute redirects", () => {
    expect(sanitizeBuyerRedirect("en", "https://evil.example/steal")).toBe(
      "/en"
    );
  });

  test("rejects mismatched locale redirects", () => {
    expect(sanitizeBuyerRedirect("en", "/fr/account")).toBe("/en");
  });

  test("builds sign-in path with safe redirect", () => {
    expect(buildBuyerSignInPath("en", "/account")).toBe(
      "/en/account/sign-in?redirect=%2Fen%2Faccount"
    );
  });
});
