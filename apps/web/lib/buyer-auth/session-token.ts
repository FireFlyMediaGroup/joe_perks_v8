import { createHmac, timingSafeEqual } from "node:crypto";
import { BUYER_SESSION_MAX_AGE_SECONDS } from "./constants";

export interface BuyerSessionPayload {
  buyerId: string;
  exp: number;
  iat: number;
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function createBuyerSessionToken(input: {
  buyerId: string;
  now?: number;
  secret: string;
}): string {
  const issuedAt = input.now ?? Math.floor(Date.now() / 1000);
  const payload: BuyerSessionPayload = {
    buyerId: input.buyerId,
    exp: issuedAt + BUYER_SESSION_MAX_AGE_SECONDS,
    iat: issuedAt,
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, input.secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyBuyerSessionToken(input: {
  now?: number;
  secret: string;
  token: string;
}): BuyerSessionPayload | null {
  const parts = input.token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;
  if (!(encodedPayload && signature)) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, input.secret);
  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(encodedPayload)) as Partial<BuyerSessionPayload>;
    if (
      typeof parsed.buyerId !== "string" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.iat !== "number"
    ) {
      return null;
    }

    const now = input.now ?? Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) {
      return null;
    }

    return {
      buyerId: parsed.buyerId,
      exp: parsed.exp,
      iat: parsed.iat,
    };
  } catch {
    return null;
  }
}
