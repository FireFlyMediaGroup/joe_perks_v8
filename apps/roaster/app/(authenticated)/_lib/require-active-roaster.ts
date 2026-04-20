import { database } from "@joe-perks/db";

import { requireRoasterId } from "../products/_lib/require-roaster";

export type RequireActiveRoasterResult =
  | { ok: true; roasterId: string }
  | { ok: false; error: "no_roaster" | "suspended" | "unauthorized" };

export async function requireActiveRoasterId(): Promise<RequireActiveRoasterResult> {
  const session = await requireRoasterId();
  if (!session.ok) {
    return session;
  }

  const roaster = await database.roaster.findUnique({
    select: { status: true },
    where: { id: session.roasterId },
  });

  if (!roaster) {
    return { ok: false, error: "no_roaster" };
  }

  if (roaster.status === "SUSPENDED") {
    return { ok: false, error: "suspended" };
  }

  return session;
}
