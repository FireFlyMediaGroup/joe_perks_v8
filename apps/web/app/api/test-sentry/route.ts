export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry smoke test — this error is intentional.");
}
