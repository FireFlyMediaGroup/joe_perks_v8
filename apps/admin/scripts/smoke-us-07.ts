/**
 * HTTP smoke for US-07-01 (orders) and US-07-02 (settings).
 *
 * Requires a running admin app (default http://127.0.0.1:3003) and Basic auth env:
 * - ADMIN_EMAIL, ADMIN_PASSWORD (same as apps/admin — typically from root `.env`)
 *
 * Run: `pnpm admin:smoke:us-07` (from repo root) after `pnpm dev` or `pnpm --filter admin dev`.
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(scriptDir, "../../../.env") });
config({ path: resolve(scriptDir, "../.env.local") });

const baseUrl = (
  process.env.ADMIN_SMOKE_BASE_URL ?? "http://127.0.0.1:3003"
).replace(/\/$/, "");
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD?.trim();

function basicAuthHeader(user: string, pass: string): string {
  const token = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

interface Check {
  markers: string[];
  name: string;
  path: string;
}

async function fetchText(
  path: string,
  auth: string
): Promise<{ status: number; text: string }> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: auth },
    redirect: "manual",
  });
  const text = await res.text();
  return { status: res.status, text };
}

function assertMarkers(
  name: string,
  text: string,
  markers: readonly string[]
): void {
  for (const m of markers) {
    if (!text.includes(m)) {
      throw new Error(
        `${name}: expected HTML to include marker ${JSON.stringify(m)}`
      );
    }
  }
}

async function main(): Promise<void> {
  if (!(email && password)) {
    console.error(
      "admin smoke: set ADMIN_EMAIL and ADMIN_PASSWORD (e.g. in root .env or apps/admin/.env.local)."
    );
    process.exit(1);
  }

  const auth = basicAuthHeader(email, password);

  const checks: Check[] = [
    {
      markers: ["Orders", "SLA"],
      name: "US-07-01 orders list",
      path: "/orders",
    },
    {
      markers: ["Platform settings", "Platform fee"],
      name: "US-07-02 settings editor",
      path: "/settings",
    },
  ];

  const results: {
    markersOk: boolean;
    name: string;
    path: string;
    status: number;
  }[] = [];

  for (const c of checks) {
    const { status, text } = await fetchText(c.path, auth);
    if (status !== 200) {
      console.error(
        JSON.stringify(
          {
            baseUrl,
            bodyPreview: text.slice(0, 400),
            error: `HTTP ${status}`,
            hint:
              status === 500
                ? "Often missing DATABASE_URL or DB unreachable; admin pages need Prisma."
                : undefined,
            name: c.name,
            path: c.path,
          },
          null,
          2
        )
      );
      process.exit(1);
    }
    try {
      assertMarkers(c.name, text, c.markers);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
    results.push({
      markersOk: true,
      name: c.name,
      path: c.path,
      status,
    });
  }

  console.log(
    JSON.stringify(
      {
        baseUrl,
        ok: true,
        results,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
