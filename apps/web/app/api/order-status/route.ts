import { NextResponse } from "next/server";

/** Polling endpoint for order status after PaymentIntent (TODO). */
export async function GET() {
  return NextResponse.json(
    { error: "Order status scaffold — not implemented" },
    { status: 501 }
  );
}
