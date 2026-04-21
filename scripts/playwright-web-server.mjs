import { execSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const rootEnvLocal = resolve(root, ".env.local");
const SESSION_SECRET_PATTERN = /^SESSION_SECRET="?([^\n"]+)"?$/m;

function readSessionSecret() {
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
