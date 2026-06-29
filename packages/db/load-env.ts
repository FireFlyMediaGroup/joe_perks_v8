import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const packageRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Loads `packages/db/.env`, then optionally `packages/db/.env.production` when
 * `PRISMA_DATABASE_PROFILE=production` (override). Use for Prisma CLI and DB smoke tests.
 */
export function loadDbEnv(): void {
  // `quiet: true` suppresses dotenv's promotional "injecting env" banner, which
  // otherwise writes to stdout and corrupts scripts whose stdout is parsed as
  // JSON (e.g. get-fulfillment-link-for-order.ts in the live smoke).
  config({ path: resolve(packageRoot, ".env"), quiet: true });
  if (process.env.PRISMA_DATABASE_PROFILE === "production") {
    const prodPath = resolve(packageRoot, ".env.production");
    if (!existsSync(prodPath)) {
      throw new Error(
        "PRISMA_DATABASE_PROFILE=production requires packages/db/.env.production with DATABASE_URL (Neon main branch). See packages/db/.env.production.example."
      );
    }
    config({ path: prodPath, override: true, quiet: true });
  }
}
