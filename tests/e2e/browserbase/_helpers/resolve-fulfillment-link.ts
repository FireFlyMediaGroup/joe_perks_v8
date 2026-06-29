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

function parseFulfillmentOutput(
  output: string
): FulfillmentLinkResult | null {
  // Defensive: the script writes JSON on its own line, but env loaders or
  // tooling may emit preamble lines to stdout. Parse the last JSON object.
  const jsonLine = output
    .split("\n")
    .map((line) => line.trim())
    .reverse()
    .find((line) => line.startsWith("{") && line.endsWith("}"));

  return jsonLine ? (JSON.parse(jsonLine) as FulfillmentLinkResult) : null;
}

// Exit code 2 from the script means "magic link not created yet" — retry.
// Any other failure should surface immediately.
function rethrowUnlessPending(error: unknown): void {
  const record =
    typeof error === "object" && error !== null
      ? (error as { status?: unknown; stderr?: unknown })
      : null;

  const exitCode =
    record && typeof record.status === "number" ? record.status : null;
  if (exitCode === 2) {
    return;
  }

  const message =
    record && typeof record.stderr === "string"
      ? record.stderr
      : String(error);
  throw new Error(`Failed to resolve fulfillment link: ${message}`);
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
        const parsed = parseFulfillmentOutput(output);
        if (parsed) {
          return parsed;
        }
      }
    } catch (error) {
      rethrowUnlessPending(error);
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 2000));
  }

  throw new Error(
    `Fulfillment magic link for order ${orderId} was not created within ${timeoutMs}ms`
  );
}
