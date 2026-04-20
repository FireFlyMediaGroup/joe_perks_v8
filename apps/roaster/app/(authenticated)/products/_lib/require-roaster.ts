import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";

export type RequireRoasterResult =
  | { ok: true; roasterId: string }
  | { ok: false; error: "unauthorized" | "no_roaster" };

export async function requireRoasterId(): Promise<RequireRoasterResult> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }

  const user = await database.user.findUnique({
    where: { externalAuthId: userId },
    select: { roasterId: true },
  });

  if (!user?.roasterId) {
    return { ok: false, error: "no_roaster" };
  }

  return { ok: true, roasterId: user.roasterId };
}
