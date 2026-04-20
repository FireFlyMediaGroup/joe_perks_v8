/**
 * Smoke tests for US-02-05 — Roaster Shipping Rate Configuration.
 *
 * Usage:
 *   cd packages/db && bun run scripts/smoke-shipping.ts
 *
 * Requires: DATABASE_URL (loaded via packages/db/load-env-bootstrap).
 * Optional: pnpm dev running (roaster on 3001) for route tests.
 *
 * Tests:
 *   1.  Schema: RoasterShippingRate model is queryable
 *   2.  Schema: label, carrier, flatRate (Int), isDefault (Boolean) fields exist
 *   3.  Schema: roasterId tenant-scoped query works
 *   4.  Schema: isDefault boolean filter works
 *   5.  Schema: orderBy label works (used in rate-list)
 *   6.  Data: No roaster has multiple default rates (at most one isDefault=true per roaster)
 *   7.  Data: All flatRate values are positive integers (cents)
 *   8.  Data: No RoasterShippingRate has NULL roasterId
 *   9.  Route: GET /settings/shipping matches /dashboard baseline (auth enforced)
 *  10.  Route: GET /products matches /dashboard baseline (alert query path)
 *  11.  Route: GET /products/new matches /dashboard baseline (alert query path)
 *  12.  Summary report of shipping rates in DB
 */
import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

let passed = 0;
let failed = 0;

function pass(label: string) {
  passed++;
  console.log(`  PASS  ${label}`);
}
function fail(label: string, detail?: string) {
  failed++;
  console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
}
function skip(label: string, reason: string) {
  console.log(`  SKIP  ${label} (${reason})`);
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: smoke script intentionally performs many sequential environment checks
async function main() {
  console.log("\n--- US-02-05 Smoke Tests (Shipping Rate Config) ---\n");

  // ── 1. Schema: RoasterShippingRate model is queryable ──
  try {
    const count = await prisma.roasterShippingRate.count();
    pass(`RoasterShippingRate model queryable (${count} row(s))`);
  } catch (e) {
    fail(
      "RoasterShippingRate model query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 2. Schema: field shape (label, carrier, flatRate, isDefault) ──
  try {
    await prisma.roasterShippingRate.findFirst({
      select: {
        id: true,
        roasterId: true,
        label: true,
        carrier: true,
        flatRate: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    pass(
      "RoasterShippingRate fields (id, roasterId, label, carrier, flatRate, isDefault) selectable"
    );
  } catch (e) {
    fail(
      "RoasterShippingRate field select failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 3. Schema: roasterId tenant-scoped query ──
  try {
    await prisma.roasterShippingRate.findMany({
      where: { roasterId: "nonexistent-tenant-id" },
      take: 1,
    });
    pass("RoasterShippingRate tenant-scoped query (roasterId filter) works");
  } catch (e) {
    fail(
      "RoasterShippingRate tenant-scoped query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 4. Schema: isDefault boolean filter works ──
  try {
    await prisma.roasterShippingRate.findFirst({
      where: { isDefault: true },
    });
    pass("RoasterShippingRate isDefault boolean filter works");
  } catch (e) {
    fail(
      "RoasterShippingRate isDefault filter failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 5. Schema: orderBy label works ──
  try {
    await prisma.roasterShippingRate.findMany({
      orderBy: { label: "asc" },
      take: 5,
    });
    pass("RoasterShippingRate orderBy label works");
  } catch (e) {
    fail(
      "RoasterShippingRate orderBy label failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 6. Data: at most one isDefault=true per roaster ──
  try {
    const roasterDefaults = await prisma.$queryRaw<
      { roasterId: string; default_count: bigint }[]
    >`
      SELECT "roasterId", COUNT(*) as default_count
      FROM "RoasterShippingRate"
      WHERE "isDefault" = true
      GROUP BY "roasterId"
      HAVING COUNT(*) > 1
    `;
    if (roasterDefaults.length === 0) {
      pass(
        "No roaster has more than one default shipping rate (invariant holds)"
      );
    } else {
      fail(
        `${roasterDefaults.length} roaster(s) have multiple default rates`,
        roasterDefaults
          .map((r) => `roasterId=${r.roasterId} count=${r.default_count}`)
          .join(", ")
      );
    }
  } catch (e) {
    fail(
      "Default-rate invariant check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 7. Data: all flatRate values are positive ──
  try {
    const badRates = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT count(*) as count FROM "RoasterShippingRate"
      WHERE "flatRate" <= 0
    `;
    const count = Number(badRates[0].count);
    if (count === 0) {
      pass("All RoasterShippingRate flatRate values are positive (> 0 cents)");
    } else {
      fail(`${count} rate(s) have flatRate <= 0`);
    }
  } catch (e) {
    fail(
      "flatRate positive check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 8. Data: no orphan rates (NULL roasterId) ──
  try {
    const orphans = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT count(*) as count FROM "RoasterShippingRate" WHERE "roasterId" IS NULL
    `;
    const count = Number(orphans[0].count);
    if (count === 0) {
      pass("No orphan shipping rates (all have roasterId)");
    } else {
      fail(`${count} rate(s) have NULL roasterId`);
    }
  } catch (e) {
    fail(
      "Orphan rate check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 9–11. Route reachability (roaster app on port 3001) ──
  let baselineStatus: number | null = null;
  try {
    const res = await fetch("http://localhost:3001/dashboard", {
      redirect: "manual",
    });
    baselineStatus = res.status;
  } catch {
    /* server not running */
  }

  if (baselineStatus === null) {
    skip(
      "Route tests (3 checks)",
      "roaster dev server not running on localhost:3001"
    );
  } else {
    const routes = [
      { path: "/settings/shipping", label: "GET /settings/shipping" },
      { path: "/products", label: "GET /products (shipping alert query)" },
      {
        path: "/products/new",
        label: "GET /products/new (shipping alert query)",
      },
    ];
    for (const route of routes) {
      try {
        const res = await fetch(`http://localhost:3001${route.path}`, {
          redirect: "manual",
        });
        if (res.status === baselineStatus) {
          pass(
            `${route.label} returns ${res.status} (matches /dashboard baseline — route registered, auth enforced)`
          );
        } else if (
          res.status === 200 ||
          res.status === 302 ||
          res.status === 307
        ) {
          pass(`${route.label} returns ${res.status}`);
        } else {
          fail(
            `${route.label} returned ${res.status} (baseline=${baselineStatus})`
          );
        }
      } catch (e) {
        fail(
          `${route.label} unreachable`,
          e instanceof Error ? e.message : "unknown"
        );
      }
    }
  }

  // ── 12. Summary: shipping rates per roaster ──
  try {
    const summary = await prisma.$queryRaw<
      { roasterId: string; total: bigint; defaults: bigint }[]
    >`
      SELECT
        "roasterId",
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "isDefault" = true) as defaults
      FROM "RoasterShippingRate"
      GROUP BY "roasterId"
      ORDER BY total DESC
    `;
    if (summary.length === 0) {
      console.log(
        "\n  INFO  No shipping rates in DB (roaster needs to add rates via UI)"
      );
    } else {
      console.log(
        `\n  INFO  Shipping rates summary (${summary.length} roaster(s)):`
      );
      for (const r of summary) {
        console.log(
          `        roasterId=${r.roasterId}  total=${r.total}  defaults=${r.defaults}`
        );
      }
    }
    pass("Shipping rate summary query succeeded");
  } catch (e) {
    fail(
      "Shipping rate summary query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── Summary ──
  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
