#!/usr/bin/env node
/**
 * Runs `stripe listen` with STRIPE_API_KEY taken from root `.env` (STRIPE_SECRET_KEY),
 * so the CLI matches the monorepo Stripe key instead of a stale saved CLI credential.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnv = resolve(__dirname, "..", ".env");

function parseDotEnv(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) {
      continue;
    }
    const eq = t.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

let stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  try {
    const raw = readFileSync(rootEnv, "utf8");
    const parsed = parseDotEnv(raw);
    stripeKey = parsed.STRIPE_SECRET_KEY;
  } catch {
    // handled below
  }
}

if (!stripeKey?.startsWith("sk_")) {
  console.error(
    "Missing STRIPE_SECRET_KEY: set it in root .env or export STRIPE_API_KEY / STRIPE_SECRET_KEY."
  );
  process.exit(1);
}

const forwardTo =
  process.env.STRIPE_LISTEN_FORWARD_TO ||
  "http://127.0.0.1:3000/api/webhooks/stripe";

const child = spawn("stripe", ["listen", "--forward-to", forwardTo], {
  stdio: "inherit",
  env: { ...process.env, STRIPE_API_KEY: stripeKey },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
