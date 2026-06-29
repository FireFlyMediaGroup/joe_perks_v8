import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface FulfillmentLinkResult {
  emailLog: {
    id: string;
    providerId: string | null;
    sentAt: string;
    to: string;
  } | null;
  expiresAt: string;
  fulfillUrl: string;
  magicLinkId: string;
  token: string;
  usedAt: string | null;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required to resolve the fulfillment magic link (prod Neon pooled URL)."
    );
  }
  return url;
}

export async function waitForFulfillmentLink(
  orderId: string,
  timeoutMs = Number(process.env.LIVE_SMOKE_SETTLE_TIMEOUT_MS ?? "120000")
): Promise<FulfillmentLinkResult> {
  requireDatabaseUrl();
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
  const script = resolve(
    root,
    "packages/db/scripts/get-fulfillment-link-for-order.ts"
  );
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const output = execSync(`bun run "${script}" ${orderId}`, {
        cwd: resolve(root, "packages/db"),
        encoding: "utf8",
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();

      if (output) {
        return JSON.parse(output) as FulfillmentLinkResult;
      }
    } catch (error) {
      const exitCode =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        typeof error.status === "number"
          ? error.status
          : null;
      if (exitCode !== 2) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "stderr" in error &&
          typeof error.stderr === "string"
            ? error.stderr
            : String(error);
        throw new Error(`Failed to resolve fulfillment link: ${message}`);
      }
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2000));
  }

  throw new Error(
    `Fulfillment magic link for order ${orderId} was not created within ${timeoutMs}ms`
  );
}
