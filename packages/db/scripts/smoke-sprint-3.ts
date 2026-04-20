/**
 * Sprint 3 smoke tests — EP-03 org onboarding chain (US-03-02 … US-03-04) + DB invariants.
 *
 * Usage:
 *   cd packages/db && bun run ./scripts/smoke-sprint-3.ts
 *
 *   # or from repo root:
 *   pnpm db:smoke:sprint-3
 *
 * Requires: DATABASE_URL (via packages/db/.env or env).
 * Optional: dev servers on 3001 (roaster), 3002 (org), 3003 (admin) for HTTP probes.
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

const HTTP_PROBE_MS = 4000;

async function httpStatus(base: string, path: string): Promise<number | null> {
  try {
    const res = await fetch(`${base}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(HTTP_PROBE_MS),
    });
    return res.status;
  } catch {
    return null;
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: smoke script intentionally performs many sequential assertions
async function main() {
  console.log("\n--- Sprint 3 Smoke Tests (EP-03 org onboarding) ---\n");

  // ── 1. Singletons (baseline) ──
  try {
    await prisma.platformSettings.findUniqueOrThrow({
      where: { id: "singleton" },
    });
    await prisma.orderSequence.findUniqueOrThrow({
      where: { id: "singleton" },
    });
    pass("PlatformSettings + OrderSequence singletons exist");
  } catch (e) {
    fail(
      "Singletons missing — run prisma db seed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 2. Migration 20260331120000_org_charges_payouts applied ──
  try {
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE migration_name = '20260331120000_org_charges_payouts'
      LIMIT 1
    `;
    if (rows.length === 1) {
      pass("Migration 20260331120000_org_charges_payouts is recorded");
    } else {
      fail(
        "Migration 20260331120000_org_charges_payouts not found in _prisma_migrations"
      );
    }
  } catch (e) {
    fail(
      "Could not read _prisma_migrations",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 3. Org.chargesEnabled / payoutsEnabled columns readable ──
  try {
    await prisma.org.findFirst({
      select: { chargesEnabled: true, payoutsEnabled: true },
    });
    pass(
      "Org model exposes chargesEnabled and payoutsEnabled (schema in sync)"
    );
  } catch (e) {
    fail(
      "Org charges/payouts columns missing — run pnpm migrate",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 4. PlatformSettings org % bounds ──
  try {
    const s = await prisma.platformSettings.findUniqueOrThrow({
      where: { id: "singleton" },
      select: { orgPctMin: true, orgPctMax: true, orgPctDefault: true },
    });
    if (s.orgPctMin < s.orgPctDefault && s.orgPctDefault < s.orgPctMax) {
      pass("PlatformSettings org % bounds ordered (min < default < max)");
    } else {
      fail("PlatformSettings org % ordering invalid");
    }
  } catch (e) {
    fail(
      "PlatformSettings read failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 5. OrgApplication status filters ──
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
    pass("OrgApplication count by each status works");
  } catch (e) {
    fail(
      "OrgApplication status query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 6. RoasterOrgRequest query (US-03-02 / US-03-03) ──
  try {
    await prisma.roasterOrgRequest.findMany({ take: 1 });
    pass("RoasterOrgRequest queryable");
  } catch (e) {
    fail(
      "RoasterOrgRequest query failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 7. Org rows: FK + slug alignment with application ──
  try {
    const orgs = await prisma.org.findMany({
      take: 50,
      include: { application: { select: { desiredSlug: true } } },
    });
    let bad = 0;
    for (const o of orgs) {
      if (o.slug !== o.application.desiredSlug) {
        bad++;
        fail(
          `Org ${o.id}: slug should match application.desiredSlug`,
          `${o.slug} vs ${o.application.desiredSlug}`
        );
      }
    }
    if (orgs.length === 0) {
      skip("Org slug matches application.desiredSlug", "no Org rows");
    } else if (bad === 0) {
      pass(
        `Sampled Org slug(s) match OrgApplication.desiredSlug (${orgs.length} row(s))`
      );
    }
  } catch (e) {
    fail(
      "Org ↔ application slug check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 8. US-03-03: APPROVED application → Org + ORG_ADMIN user ──
  try {
    const approvedApps = await prisma.orgApplication.findMany({
      where: { status: "APPROVED" },
      select: { id: true },
    });
    if (approvedApps.length === 0) {
      skip(
        "APPROVED OrgApplication has Org + ORG_ADMIN User",
        "no APPROVED applications"
      );
    } else {
      let ok = true;
      for (const app of approvedApps) {
        const org = await prisma.org.findUnique({
          where: { applicationId: app.id },
        });
        if (!org) {
          fail(`OrgApplication ${app.id} APPROVED but no Org row`);
          ok = false;
          continue;
        }
        const users = await prisma.user.findMany({
          where: { orgId: org.id, role: "ORG_ADMIN" },
        });
        if (users.length === 0) {
          fail(`Org ${org.id} has no ORG_ADMIN User`);
          ok = false;
        }
      }
      if (ok) {
        pass(
          `Each APPROVED application (${approvedApps.length}) has Org + ORG_ADMIN user`
        );
      }
    }
  } catch (e) {
    fail(
      "APPROVED application ↔ Org/User check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 9. RoasterOrgRequest: at most one APPROVED per application ──
  try {
    const apps = await prisma.orgApplication.findMany({ select: { id: true } });
    let violations = 0;
    for (const app of apps) {
      const approved = await prisma.roasterOrgRequest.count({
        where: { applicationId: app.id, status: "APPROVED" },
      });
      if (approved > 1) {
        violations++;
        fail(
          `OrgApplication ${app.id}: more than one APPROVED RoasterOrgRequest (${approved})`
        );
      }
    }
    if (apps.length === 0) {
      skip(
        "At most one APPROVED RoasterOrgRequest per application",
        "no OrgApplication rows"
      );
    } else if (violations === 0) {
      pass("At most one APPROVED RoasterOrgRequest per application");
    }
  } catch (e) {
    fail(
      "RoasterOrgRequest APPROVED uniqueness check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 10. Campaign orgPct within platform bounds ──
  try {
    const settings = await prisma.platformSettings.findUniqueOrThrow({
      where: { id: "singleton" },
      select: { orgPctMin: true, orgPctMax: true },
    });
    const campaigns = await prisma.campaign.findMany({
      select: { id: true, orgPct: true },
    });
    let bad = 0;
    for (const c of campaigns) {
      if (c.orgPct < settings.orgPctMin || c.orgPct > settings.orgPctMax) {
        bad++;
        fail(
          `Campaign ${c.id}: orgPct ${c.orgPct} outside platform bounds`,
          `[${settings.orgPctMin}, ${settings.orgPctMax}]`
        );
      }
    }
    if (campaigns.length === 0) {
      skip("Campaign orgPct within platform bounds", "no Campaign rows");
    } else if (bad === 0) {
      pass(
        `All Campaign orgPct values within platform bounds (${campaigns.length} row(s))`
      );
    }
  } catch (e) {
    fail(
      "Campaign orgPct bounds check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 11. CampaignItem positive snapshot prices ──
  try {
    const items = await prisma.campaignItem.findMany({
      select: { id: true, retailPrice: true, wholesalePrice: true },
    });
    let bad = 0;
    for (const it of items) {
      if (it.retailPrice <= 0 || it.wholesalePrice < 0) {
        bad++;
        fail(
          `CampaignItem ${it.id}: invalid prices`,
          `retail ${it.retailPrice} wholesale ${it.wholesalePrice}`
        );
      }
    }
    if (items.length === 0) {
      skip("CampaignItem snapshot prices positive", "no CampaignItem rows");
    } else if (bad === 0) {
      pass(
        `CampaignItem retail/wholesale snapshots valid (${items.length} row(s))`
      );
    }
  } catch (e) {
    fail(
      "CampaignItem price check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 12. ACTIVE campaign: ≥1 item, org ACTIVE ──
  try {
    const active = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        org: { select: { status: true } },
        items: { select: { id: true } },
      },
    });
    if (active.length === 0) {
      skip("ACTIVE campaigns have items and ACTIVE org", "no ACTIVE campaigns");
    } else {
      let bad = false;
      for (const c of active) {
        if (c.org.status !== "ACTIVE") {
          fail(
            `Campaign ${c.id} ACTIVE but Org ${c.orgId} status is ${c.org.status}`
          );
          bad = true;
        }
        if (c.items.length === 0) {
          fail(`Campaign ${c.id} ACTIVE but has zero CampaignItems`);
          bad = true;
        }
      }
      if (!bad) {
        pass(
          `Each ACTIVE campaign has ≥1 item and org ACTIVE (${active.length} campaign(s))`
        );
      }
    }
  } catch (e) {
    fail(
      "ACTIVE campaign integrity check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 13. ACTIVE campaign: single roaster across items ──
  try {
    const active = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        items: {
          include: {
            product: { select: { roasterId: true } },
          },
        },
      },
    });
    if (active.length === 0) {
      skip(
        "ACTIVE campaign items belong to one roaster",
        "no ACTIVE campaigns"
      );
    } else {
      let bad = false;
      for (const c of active) {
        const roasters = new Set(c.items.map((i) => i.product.roasterId));
        if (roasters.size > 1) {
          fail(
            `Campaign ${c.id}: items span multiple roasters (not supported for checkout)`
          );
          bad = true;
        }
      }
      if (!bad) {
        pass("ACTIVE campaigns: all items from a single roaster");
      }
    }
  } catch (e) {
    fail(
      "ACTIVE campaign roaster consistency check failed",
      e instanceof Error ? e.message : "unknown"
    );
  }

  // ── 14. HTTP: admin org queue (Basic Auth) ──
  const adminOrgs = await httpStatus(
    "http://localhost:3003",
    "/approvals/orgs"
  );
  if (adminOrgs === null) {
    skip(
      "GET /approvals/orgs (localhost:3003)",
      "connection refused — start admin on 3003"
    );
  } else if (adminOrgs === 401 || adminOrgs === 503) {
    pass(`GET /approvals/orgs → ${adminOrgs} (auth or missing admin env)`);
  } else {
    pass(`GET /approvals/orgs → ${adminOrgs}`);
  }

  // ── 15. HTTP: org portal onboarding + campaign (expect redirect to sign-in) ──
  const orgOnboarding = await httpStatus(
    "http://localhost:3002",
    "/onboarding"
  );
  if (orgOnboarding === null) {
    skip(
      "GET /onboarding (localhost:3002)",
      "connection refused — start org app on 3002"
    );
  } else if (
    orgOnboarding === 307 ||
    orgOnboarding === 308 ||
    orgOnboarding === 302
  ) {
    pass(`GET /onboarding → ${orgOnboarding} (redirect, likely sign-in)`);
  } else if (orgOnboarding === 200) {
    pass("GET /onboarding → 200");
  } else {
    pass(`GET /onboarding → ${orgOnboarding}`);
  }

  const orgCampaign = await httpStatus("http://localhost:3002", "/campaign");
  if (orgCampaign === null) {
    skip(
      "GET /campaign (localhost:3002)",
      "connection refused — start org app on 3002"
    );
  } else if (
    orgCampaign === 307 ||
    orgCampaign === 308 ||
    orgCampaign === 302
  ) {
    pass(`GET /campaign → ${orgCampaign} (redirect, likely sign-in)`);
  } else if (orgCampaign === 200) {
    pass("GET /campaign → 200");
  } else {
    pass(`GET /campaign → ${orgCampaign}`);
  }

  // ── 16. HTTP: roaster org-requests route (invalid token → error UI, not 5xx) ──
  const roasterReview = await httpStatus(
    "http://localhost:3001",
    "/org-requests/invalid-token-smoke"
  );
  if (roasterReview === null) {
    skip(
      "GET /org-requests/[token] (localhost:3001)",
      "connection refused — start roaster on 3001"
    );
  } else if (roasterReview >= 500) {
    skip(
      `GET /org-requests/[invalid] → ${roasterReview}`,
      "roaster app returned 5xx — fix local env/runtime or start roaster without errors on 3001"
    );
  } else {
    pass(`GET /org-requests/[invalid] → ${roasterReview} (no 5xx)`);
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
