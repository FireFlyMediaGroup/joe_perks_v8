import { NextResponse } from "next/server";

/** PaymentIntent creation + rate limit via @joe-perks/stripe (TODO). */
export async function POST() {
  return NextResponse.json(
    { error: "Checkout scaffold — not implemented" },
    { status: 501 }
  );
}
