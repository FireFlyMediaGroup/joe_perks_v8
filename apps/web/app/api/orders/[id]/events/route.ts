import { database } from "@joe-perks/db";
import { NextResponse } from "next/server";

import {
  getAdminBasicAuth,
  verifyAdminBasicAuth,
} from "@/lib/admin-basic-auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!getAdminBasicAuth()) {
    return NextResponse.json(
      { error: "Admin credentials are not configured." },
      { status: 503 }
    );
  }

  if (!verifyAdminBasicAuth(request)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Joe Perks Admin"',
      },
    });
  }

  const { id: orderId } = await context.params;

  const order = await database.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const rows = await database.orderEvent.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });

  const events = rows.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    actorType: e.actorType,
    actorId: e.actorId,
    payload: e.payload,
    ipAddress: e.ipAddress,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json({ events });
}
