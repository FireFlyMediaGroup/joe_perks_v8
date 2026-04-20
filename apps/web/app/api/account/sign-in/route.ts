import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getBuyerAuthRequestIp,
  getBuyerAuthRequestOrigin,
  requestBuyerMagicLink,
} from "@/lib/buyer-auth/magic-link";

export const runtime = "nodejs";

const buyerSignInRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  locale: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  redirect: z.string().trim().max(2048).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = buyerSignInRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const result = await requestBuyerMagicLink({
    email: parsed.data.email,
    locale: parsed.data.locale,
    origin: getBuyerAuthRequestOrigin(request),
    redirect: parsed.data.redirect,
    requestIp: getBuyerAuthRequestIp(request),
  });

  if (!result.ok && result.reason === "rate_limited") {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      { status: 429 }
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: "We couldn't send a sign-in link right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
