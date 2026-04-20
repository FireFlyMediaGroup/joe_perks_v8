import { limitGuestOrderLookup } from "@joe-perks/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getBuyerAuthRequestIp } from "../../../lib/buyer-auth/magic-link";
import {
  normalizeGuestOrderLookupEmail,
  normalizeGuestOrderLookupOrderNumber,
  serializeGuestOrderLookupOrder,
} from "../../../lib/orders/guest-order-lookup";
import { getGuestOrderLookupDetail } from "./_lib/query";

export const runtime = "nodejs";

const guestOrderLookupSchema = z.object({
  email: z.string().trim().email().max(320),
  orderNumber: z.string().trim().min(1).max(64),
});

const INVALID_INPUT_ERROR =
  "Enter the email from your order and your order number.";
const NOT_FOUND_ERROR =
  "We couldn't find an order with that email and order number.";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: INVALID_INPUT_ERROR }, { status: 400 });
  }

  const parsed = guestOrderLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: INVALID_INPUT_ERROR }, { status: 400 });
  }

  const { success } = await limitGuestOrderLookup(
    getBuyerAuthRequestIp(request)
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many lookup attempts. Please try again later." },
      { status: 429 }
    );
  }

  const order = await getGuestOrderLookupDetail({
    buyerEmail: normalizeGuestOrderLookupEmail(parsed.data.email),
    orderNumber: normalizeGuestOrderLookupOrderNumber(parsed.data.orderNumber),
  });

  if (!order) {
    return NextResponse.json({ error: NOT_FOUND_ERROR }, { status: 404 });
  }

  return NextResponse.json({
    order: serializeGuestOrderLookupOrder(order),
  });
}
