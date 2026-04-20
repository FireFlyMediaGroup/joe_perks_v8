import { NextResponse } from "next/server";
import { z } from "zod";
import { redeemBuyerMagicLink } from "@/lib/buyer-auth/magic-link";
import { writeBuyerSession } from "@/lib/buyer-auth/session";

export const runtime = "nodejs";

const redeemBuyerAuthSchema = z.object({
  token: z.string().trim().min(1).max(128),
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

  const parsed = redeemBuyerAuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "invalid", error: "This sign-in link is invalid." },
      { status: 400 }
    );
  }

  const result = await redeemBuyerMagicLink(parsed.data.token);
  if (!result.ok) {
    let errorMessage = "This sign-in link is invalid.";
    if (result.reason === "expired") {
      errorMessage = "This sign-in link has expired.";
    } else if (result.reason === "used") {
      errorMessage = "This sign-in link has already been used.";
    }

    return NextResponse.json(
      {
        code: result.reason,
        error: errorMessage,
      },
      { status: 400 }
    );
  }

  await writeBuyerSession(result.buyerId);

  return NextResponse.json({
    ok: true,
    redirect: result.redirect,
  });
}
