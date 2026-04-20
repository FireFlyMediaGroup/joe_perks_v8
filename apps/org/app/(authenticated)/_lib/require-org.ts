import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";

export type RequireOrgResult =
  | { ok: true; orgId: string }
  | { ok: false; error: "unauthorized" | "no_org" };

export async function requireOrgId(): Promise<RequireOrgResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }

  const user = await database.user.findUnique({
    where: { externalAuthId: userId },
    select: { orgId: true },
  });

  if (!user?.orgId) {
    return { ok: false, error: "no_org" };
  }

  return { ok: true, orgId: user.orgId };
}
