import { database } from "@joe-perks/db";
import { auth } from "@repo/auth/server";

import { isPlatformAdminUser } from "./platform-admin";

export type PlatformAdminSession =
  | {
      ok: true;
      admin: {
        actorLabel: string;
        email: string;
        id: string;
      };
    }
  | { ok: false; error: "unauthorized" | "forbidden" };

export async function requirePlatformAdmin(): Promise<PlatformAdminSession> {
  const { userId } = await auth();
  if (!userId) {
    return { ok: false, error: "unauthorized" };
  }

  const user = await database.user.findUnique({
    select: {
      email: true,
      id: true,
      isPlatformAdmin: true,
      role: true,
    },
    where: { externalAuthId: userId },
  });

  if (!isPlatformAdminUser(user)) {
    return { ok: false, error: "forbidden" };
  }

  if (!user) {
    return { ok: false, error: "forbidden" };
  }

  return {
    ok: true,
    admin: {
      actorLabel: user.email,
      email: user.email,
      id: user.id,
    },
  };
}
