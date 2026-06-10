import { database } from "@joe-perks/db";

export const dynamic = "force-dynamic";

// Unauthenticated monitoring endpoint. It intentionally returns only coarse
// component statuses ("ok" | "error") and never echoes env presence, error
// messages, or driver internals — detailed failures are logged server-side.
type ComponentStatus = "ok" | "error";

async function checkSingleton(
  query: () => Promise<{ id: string } | null>,
  label: string
): Promise<ComponentStatus> {
  try {
    const row = await query();
    return row ? "ok" : "error";
  } catch (error) {
    console.error(`[health] ${label} check failed`, error);
    return "error";
  }
}

export async function GET() {
  const [platformSettings, orderSequence] = await Promise.all([
    checkSingleton(
      () =>
        database.platformSettings.findUnique({
          where: { id: "singleton" },
          select: { id: true },
        }),
      "platformSettings"
    ),
    checkSingleton(
      () =>
        database.orderSequence.findUnique({
          where: { id: "singleton" },
          select: { id: true },
        }),
      "orderSequence"
    ),
  ]);

  const ok = platformSettings === "ok" && orderSequence === "ok";

  return Response.json(
    { ok, platformSettings, orderSequence },
    { status: ok ? 200 : 500 }
  );
}
