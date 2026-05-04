/**
 * HTTP smoke for admin Clerk auth boundaries.
 *
 * Requires a running admin app (default http://127.0.0.1:3003) with Admin Clerk env configured.
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

interface Check {
  name: string;
  path: string;
}

async function fetchText(path: string): Promise<{
  location: string | null;
  status: number;
  text: string;
}> {
  const res = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
  });
  const text = await res.text();
  return { location: res.headers.get("location"), status: res.status, text };
}

async function main(): Promise<void> {
  const checks: Check[] = [
    {
      name: "US-07-01 orders list",
      path: "/orders",
    },
    {
      name: "US-07-02 settings editor",
      path: "/settings",
    },
  ];

  const results: {
    location: string | null;
    name: string;
    path: string;
    status: number;
  }[] = [];

  const signIn = await fetchText("/sign-in");
  if (signIn.status !== 200) {
    console.error(
      JSON.stringify(
        {
          baseUrl,
          bodyPreview: signIn.text.slice(0, 400),
          error: `HTTP ${signIn.status}`,
          name: "Admin Clerk sign-in",
          path: "/sign-in",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  results.push({
    location: signIn.location,
    name: "Admin Clerk sign-in",
    path: "/sign-in",
    status: signIn.status,
  });

  for (const c of checks) {
    const { location, status, text } = await fetchText(c.path);
    const redirectsToSignIn =
      [302, 303, 307, 308].includes(status) && location?.includes("sign-in");
    if (!redirectsToSignIn) {
      console.error(
        JSON.stringify(
          {
            baseUrl,
            bodyPreview: text.slice(0, 400),
            error: `Expected redirect to sign-in, received HTTP ${status}`,
            location,
            name: c.name,
            path: c.path,
          },
          null,
          2
        )
      );
      process.exit(1);
    }
    results.push({
      location,
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
