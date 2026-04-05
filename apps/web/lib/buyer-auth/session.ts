import "server-only";

import { cookies } from "next/headers";
import { env } from "@/env";
import {
  BUYER_SESSION_COOKIE_NAME,
  BUYER_SESSION_MAX_AGE_SECONDS,
} from "./constants";
import {
  createBuyerSessionToken,
  type BuyerSessionPayload,
  verifyBuyerSessionToken,
} from "./session-token";

function getSessionSecret(): string {
  const secret = env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a stable secret at least 32 characters long."
    );
  }
  return secret;
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    maxAge: BUYER_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function readBuyerSession(): Promise<BuyerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(BUYER_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyBuyerSessionToken({
    secret: getSessionSecret(),
    token,
  });
}

export async function writeBuyerSession(buyerId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    BUYER_SESSION_COOKIE_NAME,
    createBuyerSessionToken({
      buyerId,
      secret: getSessionSecret(),
    }),
    buildCookieOptions()
  );
}

export async function clearBuyerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(BUYER_SESSION_COOKIE_NAME, "", {
    ...buildCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
