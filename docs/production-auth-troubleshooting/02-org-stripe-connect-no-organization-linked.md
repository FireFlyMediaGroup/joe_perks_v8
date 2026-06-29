# Issue 02 — Org portal: “No organization is linked to this account”

**Portal:** `https://orgs.joeperks.com` (onboarding / Stripe Connect)  
**App:** `apps/org`  
**Status:** Open  
**Priority:** Second (after roaster sign-in — issue 01)

---

## Symptom

User can **sign in** to the org portal with Google as `wearefireflymedia@gmail.com`, but on **Payments onboarding** the UI shows:

> **No organization is linked to this account.** If you were recently approved, try signing out and signing back in. Otherwise contact support.

This is rendered by the org onboarding page when the signed-in Clerk user has **no `User.orgId`** in Postgres.

---

## Expected behavior

1. Org exists in DB (`Org` row, slug e.g. `e2e-test-org`).
2. Org admin `User` row has:
   - `role = ORG_ADMIN`
   - `orgId = <that org’s id>`
   - `externalAuthId = <Clerk user id from the org Clerk instance>`
3. Onboarding page loads Connect status and can start Stripe Connect (`apps/org/app/api/stripe/connect/route.ts`).

---

## Root cause analysis (confirmed in prod DB, 2026-06-28)

### Code path

```29:44:apps/org/app/(authenticated)/onboarding/page.tsx
  const dbUser = await database.user.findUnique({
    where: { externalAuthId: userId },
    select: { orgId: true },
  });

  if (!dbUser?.orgId) {
    return (
      // "No organization is linked to this account..."
    );
  }
```

The page looks up **`User` by Clerk session `userId` only**. It does not fall back to email.

### Database state

| Fact | Value |
|---|---|
| Org slug | `e2e-test-org` |
| Org email | `wearefireflymedia@gmail.com` |
| Users with `orgId = e2e-test-org` | **0 rows** |
| Single `User` for `wearefireflymedia@gmail.com` | `role = PLATFORM_ADMIN`, `orgId = null`, `externalAuthId = user_3DEsIVm…` |

That `externalAuthId` belongs to the **admin** Clerk instance (user signed into admin before, or admin webhook ran first).

When the same person signs into the **org** Clerk instance:

- Clerk assigns a **different** `user_…` id (three separate Clerk apps per ADR).
- Org portal queries `User` by org Clerk `userId` → **no row** (or row without `orgId`) → error message.

### Architectural constraint

`User.email` is **unique**. The schema stores **one** `externalAuthId` per user. Three Clerk instances ⇒ three possible Clerk ids for the same human email ⇒ **you cannot use the same email for org admin and platform admin** without a schema/code change.

See: [`docs/adr/0007-three-clerk-instances-per-portal.md`](../adr/0007-three-clerk-instances-per-portal.md)

### Why seed + webhook did not save org linkage

E2E org seed created a `User` with `clerk_pending:…` and `orgId` set (`packages/db/scripts/seed-e2e-org.ts`). That row was effectively **lost or never merged** because:

1. The same email was reused for **platform admin** promotion, collapsing to one row with `PLATFORM_ADMIN` and `orgId = null`, **or**
2. Org Clerk webhook could not `create` a second row (email unique) and did not update the existing admin row’s `externalAuthId` to the org Clerk id (merge only runs for `clerk_pending:` prefix — see `packages/db/clerk-user-sync.ts`).

---

## Likely causes (ranked)

1. **Email reused across admin + org portals** (confirmed for `wearefireflymedia@gmail.com`) — primary cause.
2. **Org Clerk webhook missing/failing** — `CLERK_WEBHOOK_SECRET` not set on org Vercel project (template has it commented out).
3. **Org never approved through real approval chain** — no `Org` / `User` for production path (less likely here; org exists from seed).
4. **Signed in before webhook processed** — usually fixed by sign-out/in **if** webhook and DB row are correct (not the case today).

---

## Investigation steps

### A. Confirm Clerk session user id vs DB

1. While signed into org portal, read Clerk user id (Clerk Dashboard → Users, or decode session in DevTools if available).
2. Query DB:

```bash
cd packages/db && PRISMA_DATABASE_PROFILE=production bun -e "
import './load-env-bootstrap';
import { PrismaClient } from './generated/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;
const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const email = 'wearefireflymedia@gmail.com';
const byEmail = await p.user.findUnique({ where: { email } });
const org = await p.org.findFirst({ where: { slug: 'e2e-test-org' }, select: { id: true, email: true, status: true } });
const orgAdmins = await p.user.findMany({ where: { orgId: org?.id } });
console.log({ byEmail, org, orgAdmins });
await p.\$disconnect();
"
```

3. Compare org Clerk `userId` to `byEmail.externalAuthId` — expect **mismatch**.

### B. Org Clerk webhook

1. Vercel `joe-perks-org` production → `CLERK_WEBHOOK_SECRET` set?
2. Clerk org instance → webhook `https://orgs.joeperks.com/api/webhooks/clerk` → recent `user.created` / `user.updated` deliveries and HTTP status.
3. Code: `apps/org/app/api/webhooks/clerk/route.ts` calls `upsertUserFromClerkWebhook(..., 'ORG_ADMIN')`.

### C. Vercel org Clerk keys

Confirm live org keys on Vercel (org sign-in works, so keys likely exist even if repo template comments them out).

---

## Resolution options

Pick **one** strategy; do not mix blindly.

### Option A — Recommended for smoke lane: **Separate org admin email**

Use a **different email** for org portal than admin portal (matches smoke lane plan):

- Org portal / org record: e.g. `wearefireflymedia+internal-smoke-lane@gmail.com` or dedicated inbox
- Admin portal: keep `wearefireflymedia@gmail.com` or `joe@joeperks.com`

Steps:

1. Create org admin Clerk user on **org** instance with the **org-only email**.
2. Ensure `Org.email` and `User.email` match that address with `orgId` set.
3. Sign into org portal with **org email only**.

For existing `e2e-test-org` throwaway tenant, either:

- Update `Org.email` + create new `User` row with org Clerk id and `ORG_ADMIN`, **or**
- Bootstrap fresh `internal-smoke-lane` org via frontend/runbook with a dedicated org email.

### Option B — One-time DB repair for testing (same email — fragile)

Only if you accept that **admin and org cannot both work** with the same email under current schema:

1. Sign into **org** portal; note org Clerk `user_…` id.
2. Update the single `User` row OR create org-specific user:

```sql
-- Example shape — adjust ids from investigation
UPDATE "User"
SET
  "externalAuthId" = '<org_clerk_user_id>',
  role = 'ORG_ADMIN',
  "orgId" = '<e2e-test-org org id>',
  "isPlatformAdmin" = false,
  role = 'ORG_ADMIN'
WHERE email = 'wearefireflymedia@gmail.com';
```

⚠️ This **breaks admin portal sign-in** for that email until you revert or use a different admin email (`joe@joeperks.com` remains valid for admin).

### Option C — Code change (product fix, larger scope)

- Lookup user by email when `externalAuthId` miss occurs, or
- Store per-portal Clerk ids (schema migration), or
- Single Clerk instance with metadata roles (contradicts ADR-0007).

Track as separate engineering task if long-term same-email across portals is required.

### Option D — Fix webhook + `clerk_pending` merge for new orgs

For **future** org approvals (not retroactive for overwritten row):

1. Ensure org webhook secret configured.
2. Org approval creates `User` with `clerk_pending:` + `orgId` (`approve-org` flow already does this).
3. First org-portal sign-in merges pending row by email.

Won’t help if the email row is already bound to admin Clerk id.

---

## Verification (definition of done)

- [ ] Org portal sign-in with the **org admin email** (not shared with admin portal)
- [ ] `User` row: `role = ORG_ADMIN`, `orgId` set, `externalAuthId` matches **org** Clerk user id
- [ ] `/onboarding` shows Connect UI (not “No organization is linked…”)
- [ ] `POST /api/stripe/connect` returns Stripe hosted onboarding URL (may still fail later on placeholder `acct_e2e_*` — separate Stripe issue)

---

## Files to inspect when implementing fixes

| Path | Why |
|---|---|
| `apps/org/app/(authenticated)/onboarding/page.tsx` | Error message trigger |
| `apps/org/app/api/webhooks/clerk/route.ts` | Org user sync |
| `apps/org/app/api/stripe/connect/route.ts` | Connect after linkage |
| `packages/db/clerk-user-sync.ts` | Merge rules (`clerk_pending:` only) |
| `apps/roaster/app/org-requests/_actions/approve-org.ts` | Creates org + pending user |
| `packages/db/scripts/seed-e2e-org.ts` | How E2E org user was seeded |

---

## Relation to smoke lane

The smoke lane runbook intentionally uses **plus-addressed org email** separate from admin (`docs/runbooks/prod-smoke-lane.md`). Follow that pattern when fixing this issue permanently.
