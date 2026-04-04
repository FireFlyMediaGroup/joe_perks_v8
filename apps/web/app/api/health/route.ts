import { database } from "@joe-perks/db";

export const dynamic = "force-dynamic";

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
    checks.platformSettings = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }

  try {
    const seq = await database.orderSequence.findUnique({
      where: { id: "singleton" },
      select: { id: true },
    });
    checks.orderSequence = seq ? "ok" : "MISSING";
  } catch (error) {
    checks.orderSequence = `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }

  const ok =
    checks.DATABASE_URL === "set" &&
    checks.platformSettings === "ok" &&
    checks.orderSequence === "ok";

  return Response.json({ ok, ...checks }, { status: ok ? 200 : 500 });
}
