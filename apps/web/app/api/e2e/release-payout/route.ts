import { database } from "@joe-perks/db";
import { NextResponse } from "next/server";

import { runPayoutRelease } from "@/lib/inngest/run-payout-release";

export const runtime = "nodejs";

/**
 * E2E-only test affordance (MP-02): drive an order to a payout-eligible state and
 * run the payout-release job synchronously, so the money-path e2e can assert the
 * transfer without waiting on the daily cron.
 *
 * Hard-gated on `NEXT_PUBLIC_E2E_TEST_MODE === "1"` (set only by the Playwright
 * web server). It is **inert (404) in any normal build**, including production,
 * where that variable is unset.
 *
 * Defense-in-depth: `NEXT_PUBLIC_*` flags are easy to misconfigure, so we also
 * refuse outright in any production runtime. This route must never release money
 * in production regardless of how the public flag is set.
 */
function e2eDisabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_E2E_TEST_MODE !== "1" ||
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export async function POST(request: Request) {
  if (e2eDisabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { orderId?: string };
  try {
    body = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!body.orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // Mark delivered + past the payout hold so the release job selects it.
  await database.order.updateMany({
    data: {
      deliveredAt: new Date(),
      payoutEligibleAt: new Date(Date.now() - 60_000),
      payoutStatus: "HELD",
      status: "DELIVERED",
    },
    where: { id: body.orderId },
  });

  await runPayoutRelease();

  const order = await database.order.findUnique({
    select: {
      payoutStatus: true,
      status: true,
      stripeOrgTransfer: true,
      stripeTransferId: true,
    },
    where: { id: body.orderId },
  });

  // Surface the failure reason (the payout logger goes to Logtail, not stdout, in
  // production builds, so this is how the e2e sees why a payout failed).
  const failure =
    order?.payoutStatus === "FAILED"
      ? await database.orderEvent.findFirst({
          orderBy: { createdAt: "desc" },
          select: { payload: true },
          where: { eventType: "PAYOUT_FAILED", orderId: body.orderId },
        })
      : null;

  return NextResponse.json({
    failure: failure?.payload ?? null,
    orgTransferId: order?.stripeOrgTransfer ?? null,
    payoutStatus: order?.payoutStatus ?? null,
    roasterTransferId: order?.stripeTransferId ?? null,
    status: order?.status ?? null,
  });
}
