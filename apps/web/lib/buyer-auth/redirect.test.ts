import { describe, expect, test } from "vitest";
import { buildBuyerSignInPath, sanitizeBuyerRedirect } from "./redirect";

describe("buyer auth redirect helpers", () => {
  test("defaults to the buyer dashboard when no redirect is provided", () => {
    expect(sanitizeBuyerRedirect()).toBe("/account?focus=orders-heading");
  });

  test("keeps internal redirects", () => {
    expect(sanitizeBuyerRedirect("/account/orders/ord_123")).toBe(
      "/account/orders/ord_123"
    );
  });

  test("preserves query and hash on internal redirects", () => {
    expect(sanitizeBuyerRedirect("/account?focus=orders-heading")).toBe(
      "/account?focus=orders-heading"
    );
  });

  test("rejects absolute redirects", () => {
    expect(sanitizeBuyerRedirect("https://evil.example/steal")).toBe(
      "/account?focus=orders-heading"
    );
  });

  test("rejects protocol-relative redirects", () => {
    expect(sanitizeBuyerRedirect("//evil.example/steal")).toBe(
      "/account?focus=orders-heading"
    );
  });

  test("builds sign-in path with safe redirect", () => {
    expect(buildBuyerSignInPath("/account")).toBe(
      "/account/sign-in?redirect=%2Faccount"
    );
  });
});
