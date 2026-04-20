import { database } from "@joe-perks/db";
import { limitGuestOrderLookup } from "@joe-perks/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getBuyerAuthRequestIp,
  getBuyerAuthRequestOrigin,
  requestBuyerMagicLink,
} from "@/lib/buyer-auth/magic-link";

export const runtime = "nodejs";

const signInFromOrderSchema = z.object({
  locale: z
    .string()
    .trim()
    .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  paymentIntentId: z.string().trim().min(1).max(200),
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

  const parsed = signInFromOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "We couldn't send a sign-in link right now. Please try again." },
      { status: 400 }
    );
  }

  const requestIp = getBuyerAuthRequestIp(request);
  const { success } = await limitGuestOrderLookup(requestIp);
  if (!success) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please try again later." },
      { status: 429 }
    );
  }

  const order = await database.order.findUnique({
    where: { stripePiId: parsed.data.paymentIntentId },
    select: {
      buyerEmail: true,
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "We couldn't send a sign-in link right now. Please try again." },
      { status: 404 }
    );
  }

  const result = await requestBuyerMagicLink({
    email: order.buyerEmail,
    locale: parsed.data.locale,
    origin: getBuyerAuthRequestOrigin(request),
    redirect: parsed.data.redirect,
    requestIp,
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
