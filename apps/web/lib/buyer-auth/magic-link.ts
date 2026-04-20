import "server-only";

import { randomBytes } from "node:crypto";
import { database } from "@joe-perks/db";
import { sendEmail } from "@joe-perks/email/send";
import {
  BUYER_AUTH_MAGIC_LINK_SUBJECT,
  BuyerAuthMagicLinkEmail,
} from "@joe-perks/email/templates/buyer-auth-magic-link";
import { limitBuyerAuth } from "@joe-perks/stripe";
import { createElement } from "react";
import { BUYER_AUTH_MAGIC_LINK_TTL_MS } from "./constants";
import { sanitizeBuyerRedirect } from "./redirect";

interface RequestBuyerMagicLinkInput {
  email: string;
  locale: string;
  origin: string;
  redirect?: string | null;
  requestIp: string;
}

type ParsedBuyerAuthPayload = {
  buyerId: string;
  redirect: string;
};

export type RedeemBuyerMagicLinkResult =
  | { ok: true; buyerId: string; redirect: string }
  | { ok: false; reason: "expired" | "invalid" | "used" };

function parseBuyerAuthPayload(payload: unknown): ParsedBuyerAuthPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  if (
    typeof raw.buyerId !== "string" ||
    typeof raw.redirect !== "string"
  ) {
    return null;
  }

  return {
    buyerId: raw.buyerId,
    redirect: raw.redirect,
  };
}

export function getBuyerAuthRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip")?.trim() ?? "0.0.0.0";
}

export function getBuyerAuthRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const proto = forwardedProto ?? url.protocol.replace(":", "");
    return `${proto}://${forwardedHost}`;
  }

  return url.origin;
}

export async function requestBuyerMagicLink(
  input: RequestBuyerMagicLinkInput
): Promise<{ ok: true } | { ok: false; reason: "rate_limited" | "send_failed" }> {
  const { success } = await limitBuyerAuth(input.requestIp);
  if (!success) {
    return { ok: false, reason: "rate_limited" };
  }

  const safeRedirect = sanitizeBuyerRedirect(input.locale, input.redirect);
  const buyer = await database.buyer.findFirst({
    where: {
      email: {
        equals: input.email,
        mode: "insensitive",
      },
    },
    select: {
      email: true,
      id: true,
      name: true,
    },
  });

  if (!buyer) {
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + BUYER_AUTH_MAGIC_LINK_TTL_MS);
  const link = await database.magicLink.create({
    data: {
      token,
      purpose: "BUYER_AUTH",
      actorId: buyer.id,
      actorType: "BUYER",
      payload: {
        buyerId: buyer.id,
        redirect: safeRedirect,
      },
      expiresAt,
    },
    select: {
      id: true,
      token: true,
    },
  });

  const authUrl = new URL(
    `/${input.locale}/account/auth/${link.token}`,
    input.origin
  );
  authUrl.searchParams.set("redirect", safeRedirect);

  try {
    await sendEmail({
      entityId: link.id,
      entityType: "buyer_auth",
      react: createElement(BuyerAuthMagicLinkEmail, {
        authUrl: authUrl.toString(),
        buyerName: buyer.name,
        expiresInMinutes: 15,
      }),
      subject: BUYER_AUTH_MAGIC_LINK_SUBJECT,
      template: "buyer_auth_magic_link",
      to: buyer.email,
    });
  } catch {
    await database.magicLink.delete({
      where: { id: link.id },
    });
    return { ok: false, reason: "send_failed" };
  }

  return { ok: true };
}

export async function redeemBuyerMagicLink(
  token: string
): Promise<RedeemBuyerMagicLinkResult> {
  return database.$transaction(async (tx) => {
    const link = await tx.magicLink.findUnique({
      where: { token },
    });

    if (!link || link.purpose !== "BUYER_AUTH") {
      return { ok: false, reason: "invalid" } as const;
    }

    if (link.usedAt) {
      return { ok: false, reason: "used" } as const;
    }

    if (link.expiresAt <= new Date()) {
      return { ok: false, reason: "expired" } as const;
    }

    const payload = parseBuyerAuthPayload(link.payload);
    if (
      !payload ||
      link.actorType !== "BUYER" ||
      link.actorId !== payload.buyerId
    ) {
      return { ok: false, reason: "invalid" } as const;
    }

    const buyer = await tx.buyer.findUnique({
      where: { id: payload.buyerId },
      select: { id: true },
    });

    if (!buyer) {
      return { ok: false, reason: "invalid" } as const;
    }

    const markUsed = await tx.magicLink.updateMany({
      where: {
        id: link.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    if (markUsed.count !== 1) {
      return { ok: false, reason: "used" } as const;
    }

    await tx.buyer.update({
      where: { id: buyer.id },
      data: { lastSignInAt: new Date() },
    });

    return {
      ok: true,
      buyerId: buyer.id,
      redirect: payload.redirect,
    } as const;
  });
}
