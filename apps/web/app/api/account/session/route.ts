import { NextResponse } from "next/server";
import { clearBuyerSession } from "@/lib/buyer-auth/session";

export const runtime = "nodejs";

async function handleClearSession() {
  await clearBuyerSession();
  return NextResponse.json({ ok: true });
}

export function DELETE() {
  return handleClearSession();
}

export function POST() {
  return handleClearSession();
}
