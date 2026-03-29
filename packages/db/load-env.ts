import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Loads `packages/db/.env`, then optionally `packages/db/.env.production` when
 * `PRISMA_DATABASE_PROFILE=production` (override). Use for Prisma CLI and DB smoke tests.
 */
export function loadDbEnv(): void {
  config({ path: resolve(packageRoot, ".env") });
  if (process.env.PRISMA_DATABASE_PROFILE === "production") {
    const prodPath = resolve(packageRoot, ".env.production");
    if (!existsSync(prodPath)) {
      throw new Error(
        "PRISMA_DATABASE_PROFILE=production requires packages/db/.env.production with DATABASE_URL (Neon main branch). See packages/db/.env.production.example."
      );
    }
    config({ path: prodPath, override: true });
  }
}
