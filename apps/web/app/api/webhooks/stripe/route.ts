import { NextResponse } from "next/server";

/** Stripe webhook — verify signature + idempotency per AGENTS.md (TODO). */
export async function POST() {
  return NextResponse.json(
    { received: false, message: "Stripe webhook scaffold — not implemented" },
    { status: 501 }
  );
}
