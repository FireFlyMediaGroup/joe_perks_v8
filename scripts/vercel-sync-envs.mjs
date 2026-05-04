#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, relative, resolve } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

const DEFAULT_SCOPE =
  process.env.VERCEL_SCOPE?.trim() || "fireflymediagroups-projects";
const DEFAULT_DIR = resolve(process.cwd(), ".vercel/env");

const PROJECTS = {
  admin: "joe-perks-admin",
  org: "joe-perks-org",
  roaster: "joe-perks-roaster",
  web: "joe-perks-web",
};

const ALLOWED_KEYS = {
  admin: new Set([
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "DATABASE_URL",
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    "NEXT_PUBLIC_SENTRY_DSN",
    "ORG_APP_ORIGIN",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "ROASTER_APP_ORIGIN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "STRIPE_SECRET_KEY",
  ]),
  org: new Set([
    "ARCJET_KEY",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "DATABASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_WEB_URL",
    "ORG_APP_ORIGIN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "STRIPE_SECRET_KEY",
  ]),
  roaster: new Set([
    "ARCJET_KEY",
    "BASEHUB_TOKEN",
    "BETTERSTACK_API_KEY",
    "BETTERSTACK_URL",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SECRET",
    "DATABASE_URL",
    "FLAGS_SECRET",
    "KNOCK_API_KEY",
    "KNOCK_FEED_CHANNEL_ID",
    "KNOCK_SECRET_API_KEY",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
    "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_KNOCK_API_KEY",
    "NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_WEB_URL",
    "ORG_APP_ORIGIN",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "ROASTER_APP_ORIGIN",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "UPLOADTHING_TOKEN",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ]),
  web: new Set([
    "ARCJET_KEY",
    "BASEHUB_TOKEN",
    "BETTERSTACK_API_KEY",
    "BETTERSTACK_URL",
    "DATABASE_URL",
    "FLAGS_SECRET",
    "INNGEST_EVENT_KEY",
    "INNGEST_SIGNING_KEY",
    "KNOCK_API_KEY",
    "KNOCK_FEED_CHANNEL_ID",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_DOCS_URL",
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_POSTHOG_HOST",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_WEB_URL",
    "PLATFORM_ALERT_EMAIL",
    "RESEND_FROM",
    "RESEND_TOKEN",
    "ROASTER_APP_ORIGIN",
    "SESSION_SECRET",
    "SENTRY_AUTH_TOKEN",
    "SENTRY_ORG",
    "SENTRY_PROJECT",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "UPLOADTHING_APP_ID",
    "UPLOADTHING_SECRET",
    "UPSTASH_REDIS_REST_TOKEN",
    "UPSTASH_REDIS_REST_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
  ]),
};

const TARGETS = new Set(["preview", "production", "development"]);
const BOM_REGEX = /^\uFEFF/;
const NEWLINE_REGEX = /\r?\n/;

function printUsage() {
  console.log(`Usage:
  node scripts/vercel-sync-envs.mjs --env <preview|production|development> [options]

Options:
  --env, -e       Vercel environment target to sync
  --dir, -d       Directory containing env files (default: .vercel/env)
  --scope, -s     Vercel team slug (default: ${DEFAULT_SCOPE})
  --project, -p   Logical project to sync (repeatable: web, roaster, org, admin)
  --apply         Perform the upload. Without this flag the script is dry-run only
  --help, -h      Show this help

Expected file names inside the env directory:
  web.<env>.env
  roaster.<env>.env
  org.<env>.env
  admin.<env>.env

Examples:
  node scripts/vercel-sync-envs.mjs --env preview
  node scripts/vercel-sync-envs.mjs --env preview --apply
  node scripts/vercel-sync-envs.mjs --env production --project web --project admin --apply
`);
}

function parseCli() {
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      apply: { type: "boolean", default: false },
      dir: { type: "string", short: "d" },
      env: { type: "string", short: "e" },
      help: { type: "boolean", short: "h", default: false },
      project: { type: "string", short: "p", multiple: true },
      scope: { type: "string", short: "s" },
    },
    strict: true,
  });

  if (values.help) {
    printUsage();
    process.exit(0);
  }

  const target = values.env?.trim();
  if (target === undefined) {
    printUsage();
    throw new Error(
      "--env is required and must be one of: preview, production, development"
    );
  }

  if (!TARGETS.has(target)) {
    printUsage();
    throw new Error(
      "--env is required and must be one of: preview, production, development"
    );
  }

  const projects = values.project?.length
    ? values.project.map((value) => value.trim())
    : Object.keys(PROJECTS);

  for (const project of projects) {
    if (!(project in PROJECTS)) {
      throw new Error(
        `Unknown project "${project}". Expected one of: ${Object.keys(PROJECTS).join(", ")}`
      );
    }
  }

  return {
    apply: values.apply,
    dir: resolve(process.cwd(), values.dir?.trim() || DEFAULT_DIR),
    projects,
    scope: values.scope?.trim() || DEFAULT_SCOPE,
    target,
  };
}

function decodeQuotedValue(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'");
}

function parseEnvFile(filePath) {
  const parsed = {};
  const content = readFileSync(filePath, "utf8").replace(BOM_REGEX, "");
  const lines = content.split(NEWLINE_REGEX);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const normalized = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length)
      : trimmed;
    const separatorIndex = normalized.indexOf("=");

    if (separatorIndex === -1) {
      throw new Error(
        `Invalid env line in ${filePath}: "${line}". Expected KEY=value`
      );
    }

    const key = normalized.slice(0, separatorIndex).trim();
    let value = normalized.slice(separatorIndex + 1).trim();

    if (!key) {
      throw new Error(`Invalid env key in ${filePath}: "${line}"`);
    }

    const quote = value.at(0);
    if (
      value.length >= 2 &&
      (quote === '"' || quote === "'") &&
      value.at(-1) === quote
    ) {
      value = decodeQuotedValue(value.slice(1, -1));
    }

    parsed[key] = value;
  }

  return parsed;
}

function getAuthToken() {
  const direct = process.env.VERCEL_TOKEN?.trim();
  if (direct) {
    return direct;
  }

  const candidates = [
    resolve(homedir(), ".vercel/auth.json"),
    resolve(
      process.env.XDG_CONFIG_HOME || resolve(homedir(), ".config"),
      "vercel/auth.json"
    ),
    resolve(homedir(), "Library/Application Support/com.vercel.cli/auth.json"),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    const parsed = JSON.parse(readFileSync(candidate, "utf8"));
    if (parsed?.token) {
      return parsed.token;
    }
  }

  throw new Error(
    "Could not find a Vercel auth token. Run `vercel login` or export VERCEL_TOKEN."
  );
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function buildPayload(project, envVars, target, sourceFile) {
  const allowedKeys = ALLOWED_KEYS[project];
  const invalidKeys = Object.keys(envVars).filter(
    (key) => !allowedKeys.has(key)
  );

  if (invalidKeys.length > 0) {
    throw new Error(
      `Unsupported keys in ${basename(sourceFile)} for project "${project}": ${invalidKeys.join(", ")}`
    );
  }

  return Object.entries(envVars).map(([key, value]) => ({
    comment: `synced from ${relative(process.cwd(), sourceFile)}`,
    key,
    target: [target],
    type: "encrypted",
    value,
  }));
}

async function uploadEnvBatch({ payload, projectName, scope, token }) {
  const response = await fetch(
    `https://api.vercel.com/v10/projects/${encodeURIComponent(projectName)}/env?slug=${encodeURIComponent(scope)}&upsert=true`,
    {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Vercel API request failed for ${projectName}: ${response.status} ${response.statusText}\n${body}`
    );
  }

  return response.json();
}

async function main() {
  const { apply, dir, projects, scope, target } = parseCli();

  const pendingUploads = [];

  for (const project of projects) {
    const filePath = resolve(dir, `${project}.${target}.env`);
    if (!existsSync(filePath)) {
      console.log(
        `Skipping ${project}: no file at ${relative(process.cwd(), filePath)}`
      );
      continue;
    }

    const parsed = parseEnvFile(filePath);
    const payload = buildPayload(project, parsed, target, filePath);

    if (payload.length === 0) {
      console.log(
        `Skipping ${project}: ${relative(process.cwd(), filePath)} is empty`
      );
      continue;
    }

    pendingUploads.push({
      filePath,
      logicalProject: project,
      payload,
      projectName: PROJECTS[project],
    });
  }

  if (pendingUploads.length === 0) {
    throw new Error(
      `No env files found for target "${target}" in ${relative(process.cwd(), dir)}`
    );
  }

  console.log(`Target: ${target}`);
  console.log(`Scope: ${scope}`);
  console.log(`Mode: ${apply ? "apply" : "dry-run"}`);
  console.log("");

  for (const upload of pendingUploads) {
    console.log(
      `${upload.logicalProject} -> ${upload.projectName} (${upload.payload.length} vars)`
    );
    console.log(`  source: ${relative(process.cwd(), upload.filePath)}`);
    console.log(`  keys: ${upload.payload.map((item) => item.key).join(", ")}`);
  }

  if (!apply) {
    console.log("");
    console.log(
      "Dry run complete. Re-run with --apply to upload these variables."
    );
    return;
  }

  const token = getAuthToken();

  for (const upload of pendingUploads) {
    for (const payloadChunk of chunk(upload.payload, 50)) {
      await uploadEnvBatch({
        payload: payloadChunk,
        projectName: upload.projectName,
        scope,
        token,
      });
    }

    console.log(
      `Uploaded ${upload.payload.length} vars to ${upload.projectName}`
    );
  }
}

main().catch((error) => {
  console.error("");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
