export const dynamic = "force-dynamic";

/**
 * Sentry smoke-test affordance. Unauthenticated 500 generators must never be
 * reachable in production — anyone could hammer it to burn Sentry quota and
 * drown real errors in noise — so it is inert (404) in any production runtime,
 * mirroring the guard on the e2e routes.
 *
 * Preview deployments share the same Sentry wiring, so verify capture there
 * (SCAFFOLD_CHECKLIST.md §7.4 / §9.4). If you must smoke-test against the
 * production deployment itself, temporarily comment out the guard below
 * (the `if (sentrySmokeTestDisabled())` block in GET), deploy, verify the
 * error in Sentry, then REVERT AND REDEPLOY IMMEDIATELY — do not leave the
 * route open in production.
 */
function sentrySmokeTestDisabled(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

export function GET() {
  if (sentrySmokeTestDisabled()) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  throw new Error("Sentry smoke test — this error is intentional.");
}
