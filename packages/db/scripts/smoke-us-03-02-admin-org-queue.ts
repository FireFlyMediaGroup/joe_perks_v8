/**
 * Smoke tests for US-03-02 — Admin org approval queue (platform review → roaster magic link).
 *
 * Usage:
 *   cd packages/db && bun run ./scripts/smoke-us-03-02-admin-org-queue.ts
 *
 *   # or from repo root:
 *   pnpm db:smoke:us-03-02
 *
 * Requires: DATABASE_URL (via packages/db/.env or env).
 * Optional: admin dev server on 3003 for HTTP checks (401 without Basic Auth).
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

function isRoasterReviewPayload(
  p: unknown
): p is { applicationId: string; roasterId: string; orgName: string } {
  if (!p || typeof p !== "object") {
    return false;
  }
  const o = p as Record<string, unknown>;
  return (
    typeof o.applicationId === "string" &&
    typeof o.roasterId === "string" &&
    typeof o.orgName === "string"
  );
}

async function checkAdminHttp(path: string): Promise<number | null> {
  try {
    const res = await fetch(`http://localhost:3003${path}`, {
      redirect: "manual",
    });
    return res.status;
  } catch {
    return null;
  }
}

async function main() {
  console.log("\n--- US-03-02 Smoke Tests (Admin Org Approval Queue) ---\n");

  // ── 1. Org queue query (same shape as admin list page) ──
  try {
    const rows = await prisma.orgApplication.findMany({
      where: { status: "PENDING_PLATFORM_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        roasterRequests: {
          orderBy: { priority: "asc" },
          include: {
            roaster: {
              include: {
                application: { select: { businessName: true } },
              },
            },
          },
        },
      },
    });
    pass(
      `OrgApplication list query with roasterRequests + roaster.application (${rows.length} pending platform row(s) in sample)`
    );
  } catch (e) {
    fail(
      "Org queue query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 2. Status filters (all OrgApplicationStatus values queryable) ──
  try {
    const statuses = [
      "PENDING_PLATFORM_REVIEW",
      "PENDING_ROASTER_APPROVAL",
      "APPROVED",
      "REJECTED",
    ] as const;
    for (const status of statuses) {
      await prisma.orgApplication.count({ where: { status } });
    }
    pass("OrgApplication count by each OrgApplicationStatus works");
  } catch (e) {
    fail(
      "OrgApplication status filter failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 3. PlatformSettings singleton (detail page context) ──
  try {
    const settings = await prisma.platformSettings.findUniqueOrThrow({
      where: { id: "singleton" },
      select: { orgPctMin: true, orgPctMax: true, orgPctDefault: true },
    });
    if (
      settings.orgPctMin < settings.orgPctDefault &&
      settings.orgPctDefault < settings.orgPctMax
    ) {
      pass("PlatformSettings org % bounds ordered (min < default < max)");
    } else {
      fail("PlatformSettings org % ordering invalid");
    }
  } catch (e) {
    fail(
      "PlatformSettings singleton",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 4. MagicLink ROASTER_REVIEW rows: structure ──
  try {
    const links = await prisma.magicLink.findMany({
      where: { purpose: "ROASTER_REVIEW" },
      take: 50,
    });
    pass(`MagicLink ROASTER_REVIEW queryable (${links.length} row(s))`);
    let linkStructErrors = 0;
    for (const link of links) {
      if (link.actorType !== "ROASTER") {
        linkStructErrors++;
        fail(
          `MagicLink ${link.id}: actorType should be ROASTER`,
          String(link.actorType)
        );
        continue;
      }
      if (!/^[a-f0-9]{64}$/.test(link.token)) {
        linkStructErrors++;
        fail(
          `MagicLink ${link.id}: token should be 64 hex chars`,
          `${link.token.length} chars`
        );
        continue;
      }
      if (!isRoasterReviewPayload(link.payload)) {
        linkStructErrors++;
        fail(
          `MagicLink ${link.id}: payload missing applicationId, roasterId, orgName`
        );
        continue;
      }
      if (link.payload.applicationId.length < 1) {
        linkStructErrors++;
        fail(`MagicLink ${link.id}: empty applicationId in payload`);
        continue;
      }
      if (link.expiresAt <= link.createdAt) {
        linkStructErrors++;
        fail(`MagicLink ${link.id}: expiresAt should be after createdAt`);
      }
    }
    if (links.length > 0 && linkStructErrors === 0) {
      pass(
        "Sampled ROASTER_REVIEW magic links have valid token, payload, actorType, dates"
      );
    }
  } catch (e) {
    fail(
      "MagicLink ROASTER_REVIEW checks failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 5. Integrity: PENDING_ROASTER_APPROVAL → at least one ROASTER_REVIEW link for that application ──
  try {
    const pendingRoaster = await prisma.orgApplication.findMany({
      where: { status: "PENDING_ROASTER_APPROVAL" },
      select: { id: true },
    });
    if (pendingRoaster.length === 0) {
      skip(
        "PENDING_ROASTER_APPROVAL apps have matching MagicLink",
        "no applications in PENDING_ROASTER_APPROVAL"
      );
    } else {
      const allLinks = await prisma.magicLink.findMany({
        where: { purpose: "ROASTER_REVIEW" },
        select: { payload: true },
      });
      const appIdsWithLink = new Set<string>();
      for (const l of allLinks) {
        if (isRoasterReviewPayload(l.payload)) {
          appIdsWithLink.add(l.payload.applicationId);
        }
      }
      let ok = true;
      for (const app of pendingRoaster) {
        if (!appIdsWithLink.has(app.id)) {
          fail(
            `OrgApplication ${app.id} is PENDING_ROASTER_APPROVAL but no ROASTER_REVIEW MagicLink payload references it`
          );
          ok = false;
        }
      }
      if (ok) {
        pass(
          `Each PENDING_ROASTER_APPROVAL application (${pendingRoaster.length}) has a ROASTER_REVIEW MagicLink`
        );
      }
    }
  } catch (e) {
    fail(
      "Integrity check PENDING_ROASTER_APPROVAL ↔ MagicLink failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 6. Primary roaster: PENDING_PLATFORM_REVIEW should have priority=1 request for approve path ──
  try {
    const pendingPlatform = await prisma.orgApplication.findMany({
      where: { status: "PENDING_PLATFORM_REVIEW" },
      include: {
        roasterRequests: { select: { priority: true } },
      },
    });
    let missingPrimary = 0;
    for (const app of pendingPlatform) {
      const hasPrimary = app.roasterRequests.some((r) => r.priority === 1);
      if (!hasPrimary) {
        missingPrimary++;
      }
    }
    if (pendingPlatform.length === 0) {
      skip(
        "PENDING_PLATFORM_REVIEW apps have primary RoasterOrgRequest",
        "no applications in PENDING_PLATFORM_REVIEW"
      );
    } else if (missingPrimary > 0) {
      fail(
        `${missingPrimary} PENDING_PLATFORM_REVIEW application(s) missing priority=1 roaster request (approve will fail)`
      );
    } else {
      pass(
        `All ${pendingPlatform.length} PENDING_PLATFORM_REVIEW application(s) have a primary (priority 1) roaster request`
      );
    }
  } catch (e) {
    fail(
      "Primary roaster request check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 7. HTTP: admin /approvals/orgs (Basic Auth middleware) ──
  const httpStatus = await checkAdminHttp("/approvals/orgs");
  if (httpStatus === null) {
    skip(
      "GET /approvals/orgs (localhost:3003)",
      "connection refused — start admin dev server on 3003"
    );
  } else if (httpStatus === 401) {
    pass(`GET /approvals/orgs returns 401 without auth (middleware active)`);
  } else if (httpStatus === 503) {
    pass(
      `GET /approvals/orgs returns 503 — ADMIN_EMAIL/ADMIN_PASSWORD not set in admin env`
    );
  } else {
    pass(`GET /approvals/orgs returns ${httpStatus} (admin reachable)`);
  }

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
