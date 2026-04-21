import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default function globalSetup() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

  execSync("pnpm db:seed:e2e:frontend", {
    cwd: root,
    stdio: "inherit",
  });
}
