import "server-only";

import { database } from "@joe-perks/db";
import { redirect } from "next/navigation";
import { buildBuyerSignInPath, sanitizeBuyerRedirect } from "./redirect";
import { clearBuyerSession, readBuyerSession } from "./session";

export interface CurrentBuyer {
  readonly email: string;
  readonly id: string;
  readonly lastSignInAt: Date | null;
  readonly name: string | null;
}

export async function getCurrentBuyer(): Promise<CurrentBuyer | null> {
  const session = await readBuyerSession();
  if (!session) {
    return null;
  }

  const buyer = await database.buyer.findUnique({
    where: { id: session.buyerId },
    select: {
      email: true,
      id: true,
      lastSignInAt: true,
      name: true,
    },
  });

  if (!buyer) {
    await clearBuyerSession();
    return null;
  }

  return buyer;
}

interface RequireCurrentBuyerInput {
  readonly locale: string;
  readonly redirectTo?: string | null;
}

export async function requireCurrentBuyer({
  locale,
  redirectTo,
}: RequireCurrentBuyerInput): Promise<CurrentBuyer> {
  const buyer = await getCurrentBuyer();
  if (buyer) {
    return buyer;
  }

  const safeRedirect = sanitizeBuyerRedirect(locale, redirectTo);
  redirect(buildBuyerSignInPath(locale, safeRedirect));
}
