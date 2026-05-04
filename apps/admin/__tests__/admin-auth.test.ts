import { expect, test } from "vitest";

import { isPlatformAdminUser } from "../app/(authenticated)/_lib/platform-admin";

test("admin auth accepts platform admin role", () => {
  expect(
    isPlatformAdminUser({ isPlatformAdmin: false, role: "PLATFORM_ADMIN" })
  ).toBe(true);
});

test("admin auth accepts explicit platform admin flag", () => {
  expect(isPlatformAdminUser({ isPlatformAdmin: true, role: "ORG_ADMIN" })).toBe(
    true
  );
});

test("admin auth rejects missing or non-admin users", () => {
  expect(isPlatformAdminUser(null)).toBe(false);
  expect(
    isPlatformAdminUser({ isPlatformAdmin: false, role: "ROASTER_ADMIN" })
  ).toBe(false);
});
