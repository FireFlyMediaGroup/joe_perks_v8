import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const rootEnvLocal = resolve(root, ".env.local");
const SESSION_SECRET_PATTERN = /^SESSION_SECRET="?([^\n"]+)"?$/m;

function readSessionSecret() {
  // CI (and any environment without a local file) provides SESSION_SECRET directly.
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (!existsSync(rootEnvLocal)) {
    throw new Error(
      "SESSION_SECRET must be set in the environment or root .env.local"
    );
  }
  const contents = readFileSync(rootEnvLocal, "utf8");
  const match = contents.match(SESSION_SECRET_PATTERN);
  if (!match?.[1]) {
    throw new Error("SESSION_SECRET is missing from root .env.local");
  }
  return match[1];
}

const env = {
  ...process.env,
  NEXT_PUBLIC_E2E_TEST_MODE: "1",
  SESSION_SECRET: readSessionSecret(),
};

execSync("pnpm --filter web build", {
  cwd: root,
  env,
  stdio: "inherit",
});

const child = spawn(
  "pnpm",
  ["--filter", "web", "exec", "next", "start", "-p", "3100"],
  {
    cwd: root,
    env,
    stdio: "inherit",
  }
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
