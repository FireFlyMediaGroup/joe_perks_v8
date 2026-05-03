/**
 * Read-only production smoke test for deployed Joe Perks surfaces.
 *
 * Usage:
 *   node ./scripts/smoke-production-http.mjs
 *   pnpm smoke:prod
 *
 * Optional env overrides:
 *   WEB_BASE_URL=https://joeperks.com
 *   ROASTER_BASE_URL=https://roasters.joeperks.com
 *   ORG_BASE_URL=https://orgs.joeperks.com
 *   ADMIN_BASE_URL=https://admin.joeperks.com
 *   SMOKE_TIMEOUT_MS=8000
 */

const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS ?? "8000");
const TITLE_RE = /<title>(.*?)<\/title>/is;

const webBaseUrl = (process.env.WEB_BASE_URL ?? "https://joeperks.com").replace(
  /\/$/,
  ""
);
const roasterBaseUrl = (
  process.env.ROASTER_BASE_URL ?? "https://roasters.joeperks.com"
).replace(/\/$/, "");
const orgBaseUrl = (
  process.env.ORG_BASE_URL ?? "https://orgs.joeperks.com"
).replace(/\/$/, "");
const adminBaseUrl = (
  process.env.ADMIN_BASE_URL ?? "https://admin.joeperks.com"
).replace(/\/$/, "");

let passed = 0;
let failed = 0;

function pass(label, detail) {
  passed++;
  console.log(`PASS  ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail) {
  failed++;
  console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
}

function normalizePath(path) {
  if (!path) {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

function getTitle(html) {
  const match = html.match(TITLE_RE);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

function fetchWithTimeout(url, options = {}) {
  const signal = AbortSignal.timeout(timeoutMs);
  return fetch(url, { ...options, signal });
}

async function expectHtmlPage({
  baseUrl,
  bodyIncludes = [],
  bodyExcludes = [],
  label,
  path,
  titleIncludes = [],
}) {
  const url = `${baseUrl}${normalizePath(path)}`;

  try {
    const res = await fetchWithTimeout(url, { redirect: "follow" });
    const body = await res.text();
    const title = getTitle(body);

    if (res.status !== 200) {
      fail(label, `expected 200, got ${res.status} (${url})`);
      return;
    }

    for (const needle of titleIncludes) {
      if (!title.includes(needle)) {
        fail(
          label,
          `missing title marker ${JSON.stringify(needle)} (${title})`
        );
        return;
      }
    }

    for (const needle of bodyIncludes) {
      if (!body.includes(needle)) {
        fail(label, `missing body marker ${JSON.stringify(needle)}`);
        return;
      }
    }

    for (const needle of bodyExcludes) {
      if (body.includes(needle)) {
        fail(label, `unexpected body marker ${JSON.stringify(needle)}`);
        return;
      }
    }

    pass(label, `${res.status} ${url}`);
  } catch (error) {
    fail(label, error instanceof Error ? error.message : "unknown error");
  }
}

async function expectJsonHealth() {
  const url = `${webBaseUrl}/api/health`;

  try {
    const res = await fetchWithTimeout(url, { redirect: "follow" });
    const body = await res.text();

    if (res.status !== 200) {
      fail("web health endpoint", `expected 200, got ${res.status}`);
      return;
    }

    const parsed = JSON.parse(body);
    const healthOk =
      parsed.ok === true &&
      parsed.DATABASE_URL === "set" &&
      parsed.platformSettings === "ok" &&
      parsed.orderSequence === "ok";

    if (!healthOk) {
      fail("web health endpoint", `unexpected payload ${body}`);
      return;
    }

    pass("web health endpoint", body);
  } catch (error) {
    fail(
      "web health endpoint",
      error instanceof Error ? error.message : "unknown error"
    );
  }
}

async function expectProtectedEntry(label, baseUrl) {
  try {
    const res = await fetchWithTimeout(baseUrl, { redirect: "follow" });
    const body = await res.text();
    const title = getTitle(body);

    if (res.status !== 200) {
      fail(label, `expected 200 after auth redirect, got ${res.status}`);
      return;
    }

    if (!res.url.includes("/sign-in")) {
      fail(label, `expected final URL to contain /sign-in, got ${res.url}`);
      return;
    }

    if (!(title.includes("Sign in") || title.includes("Welcome back"))) {
      fail(label, `expected auth title, got ${JSON.stringify(title)}`);
      return;
    }

    if (!body.includes("Joe Perks")) {
      fail(label, "expected auth page to include Joe Perks branding");
      return;
    }

    pass(label, `${res.status} ${res.url}`);
  } catch (error) {
    fail(label, error instanceof Error ? error.message : "unknown error");
  }
}

async function expectUnauthorized(label, baseUrl) {
  try {
    const res = await fetchWithTimeout(baseUrl, { redirect: "manual" });

    if (res.status !== 401) {
      fail(label, `expected 401, got ${res.status}`);
      return;
    }

    pass(label, `${res.status} ${baseUrl}`);
  } catch (error) {
    fail(label, error instanceof Error ? error.message : "unknown error");
  }
}

async function main() {
  console.log("Joe Perks production smoke test");
  console.log(
    JSON.stringify(
      {
        adminBaseUrl,
        orgBaseUrl,
        roasterBaseUrl,
        timeoutMs,
        webBaseUrl,
      },
      null,
      2
    )
  );
  console.log("");

  await expectHtmlPage({
    baseUrl: webBaseUrl,
    bodyExcludes: ["This page couldn’t load", "A server error occurred."],
    bodyIncludes: ["Joe Perks"],
    label: "web homepage",
    path: "/",
    titleIncludes: ["Joe Perks"],
  });

  await expectHtmlPage({
    baseUrl: webBaseUrl,
    bodyIncludes: ["Pricing"],
    label: "web pricing page",
    path: "/pricing",
  });

  await expectHtmlPage({
    baseUrl: webBaseUrl,
    bodyIncludes: ["Privacy Policy"],
    label: "web privacy policy",
    path: "/privacy-policy",
    titleIncludes: ["Privacy Policy"],
  });

  await expectHtmlPage({
    baseUrl: webBaseUrl,
    bodyIncludes: ["Apply as a Roaster"],
    label: "web roaster apply",
    path: "/roasters/apply",
    titleIncludes: ["Apply as a Roaster"],
  });

  await expectHtmlPage({
    baseUrl: webBaseUrl,
    bodyIncludes: ["Organization"],
    label: "web org apply",
    path: "/orgs/apply",
    titleIncludes: ["Organization"],
  });

  await expectJsonHealth();
  await expectProtectedEntry("roaster auth gate", roasterBaseUrl);
  await expectProtectedEntry("org auth gate", orgBaseUrl);
  await expectUnauthorized("admin auth gate", adminBaseUrl);

  console.log("");
  console.log(`Summary: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
