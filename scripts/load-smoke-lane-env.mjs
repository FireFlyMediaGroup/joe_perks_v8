import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ENV_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env.smoke-lane");

/**
 * Loads root `.env.smoke-lane` into process.env (does not override non-empty existing vars).
 */
export function loadSmokeLaneEnv() {
  if (!existsSync(ENV_PATH)) {
    console.warn(
      "Warning: .env.smoke-lane not found — copy from docs/runbooks/prod-smoke-lane.env.template or fill .env.smoke-lane."
    );
    return;
  }

  const content = readFileSync(ENV_PATH, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}
