import { database } from "@joe-perks/db";

export const dynamic = "force-dynamic";

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    const base = error.message || error.constructor.name;
    const extra = Object.getOwnPropertyNames(error)
      .filter((k) => k !== "message" && k !== "stack")
      .reduce(
        (acc, k) => {
          acc[k] = (error as unknown as Record<string, unknown>)[k];
          return acc;
        },
        {} as Record<string, unknown>
      );
    return Object.keys(extra).length > 0
      ? `${base} ${JSON.stringify(extra)}`
      : base;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export async function GET() {
  const checks: Record<string, unknown> = {
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV ?? "not set",
  };

  try {
    const settings = await database.platformSettings.findUnique({
      where: { id: "singleton" },
      select: { id: true },
    });
    checks.platformSettings = settings ? "ok" : "MISSING";
  } catch (error) {
    checks.platformSettings = `ERROR: ${serializeError(error)}`;
  }

  try {
    const seq = await database.orderSequence.findUnique({
      where: { id: "singleton" },
      select: { id: true },
    });
    checks.orderSequence = seq ? "ok" : "MISSING";
  } catch (error) {
    checks.orderSequence = `ERROR: ${serializeError(error)}`;
  }

  const ok =
    checks.DATABASE_URL === "set" &&
    checks.platformSettings === "ok" &&
    checks.orderSequence === "ok";

  return Response.json({ ok, ...checks }, { status: ok ? 200 : 500 });
}
