import { database } from "@joe-perks/db";
import { limitSlugValidation } from "@joe-perks/stripe";
import { isReservedSlug, isValidSlugFormat } from "@joe-perks/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip")?.trim() ?? "0.0.0.0";
}

export async function GET(request: Request) {
  const { success } = await limitSlugValidation(getClientIp(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "slug parameter required" },
      { status: 400 }
    );
  }

  if (!isValidSlugFormat(slug)) {
    return NextResponse.json({ available: false, reason: "invalid_format" });
  }

  if (isReservedSlug(slug)) {
    return NextResponse.json({ available: false, reason: "reserved" });
  }

  const existingOrg = await database.org.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existingOrg) {
    return NextResponse.json({ available: false, reason: "taken" });
  }

  const pendingApp = await database.orgApplication.findFirst({
    where: {
      desiredSlug: slug,
      status: { not: "REJECTED" },
    },
    select: { id: true },
  });
  if (pendingApp) {
    return NextResponse.json({ available: false, reason: "pending" });
  }

  return NextResponse.json({ available: true });
}
