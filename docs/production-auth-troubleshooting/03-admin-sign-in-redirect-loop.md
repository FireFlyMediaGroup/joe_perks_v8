# Issue 03 — Admin portal sign-in redirect loop

**Portal:** `https://admin.joeperks.com/sign-in`  
**App:** `apps/admin`  
**Status:** Open  
**Priority:** Third (admin approvals; use `joe@joeperks.com` as workaround if needed)

---

## Symptom

After submitting sign-in credentials (user reports prefilled username/password), the browser **loops indefinitely** between:

- `https://admin.joeperks.com/`
- `https://admin.joeperks.com/sign-in?redirect_url=https%3A%2F%2Fadmin.joeperks.com%2F`

No client-visible error message — only redirect churn.

---

## Expected behavior

1. User authenticates via **admin Clerk instance**.
2. Session cookie persists on `admin.joeperks.com`.
3. `apps/admin/app/(authenticated)/layout.tsx` calls `requirePlatformAdmin()`:
   - If Clerk session missing → redirect to sign-in **once**
   - If session present but not platform admin → **Access denied** page (not a loop)
   - If platform admin → render admin UI

---

## Why a loop (not “Access denied”) implicates session loss

```22:30:apps/admin/app/(authenticated)/layout.tsx
  const session = await requirePlatformAdmin();

  if (!session.ok && session.error === "unauthorized") {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }
```

`unauthorized` means `auth()` returned **no `userId`** — Clerk middleware does not see a valid session on the authenticated layout pass.

Loop pattern:

1. Sign-in page completes OAuth/password → redirect to `/`
2. `/` hits authenticated layout → `userId` is null → redirect to `/sign-in?redirect_url=/`
3. Clerk thinks user is signed in on sign-in route → redirect back to `/`
4. Repeat

So the bug is **session not sticking** or **Clerk middleware / key mismatch**, not missing `isPlatformAdmin` (that would show Access denied while still “signed in”).

---

## Likely causes (ranked)

### 1. Test-mode Clerk keys on production admin domain (high confidence)

Repo file `.vercel/env/admin.production.env` contains:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_…`
- `CLERK_SECRET_KEY=sk_test_…`

Cutover doc explicitly flags admin production using test keys as incorrect ([`sandbox-to-production-cutover.md`](../runbooks/sandbox-to-production-cutover.md) §3).

Test Clerk instances on custom production domains commonly cause broken sessions and redirect loops.

### 2. Clerk DNS / domain not verified for admin instance

Same as roaster issue — admin Clerk production instance needs DNS on `admin.joeperks.com` (or configured satellite domain).

### 3. Wrong Clerk instance keys (roaster/org keys pasted into admin project)

Each portal must use **its own** Clerk application keys (ADR-0007). Mismatch between publishable and secret key pairs causes auth failures.

### 4. Cookie / middleware configuration

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`
- Clerk “Allowed origins” includes `https://admin.joeperks.com`

Less common if keys are correct.

### 5. DB platform admin flag (usually NOT this loop)

If session worked but user lacked admin role, user would see **Access denied**, not redirect loop.

Prod DB **does** have platform admins:

| Email | `isPlatformAdmin` | `role` |
|---|---|---|
| `joe@joeperks.com` | true | `PLATFORM_ADMIN` |
| `wearefireflymedia@gmail.com` | true | `PLATFORM_ADMIN` |

Ensure the account used at sign-in matches a row whose **`externalAuthId` equals the admin Clerk user id** for that sign-in. If user signs in as `joe@joeperks.com` but Clerk user id drifted, you’d get Access denied — still not typically a loop.

---

## Investigation steps

### A. Verify Vercel admin production Clerk keys

1. Vercel → `joe-perks-admin` → Environment Variables → **Production**.
2. Confirm:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with **`pk_live_`** (not `pk_test_`)
   - `CLERK_SECRET_KEY` starts with **`sk_live_`**
   - Keys belong to the **admin** Clerk application (not roaster/org).
3. Redeploy after changes.

Cross-check repo template: `.vercel/env/admin.production.env` (likely stale / wrong mode).

### B. Clerk Dashboard — admin production instance

1. Domains: `admin.joeperks.com` verified.
2. Paths / redirect URLs configured.
3. Sessions / JWT settings (defaults usually fine).
4. Logs at time of loop — look for session creation followed by failed verification.

### C. Browser evidence

1. DevTools → Application → Cookies for `admin.joeperks.com`.
2. Attempt sign-in; check whether `__session` (Clerk) appears and survives navigation to `/`.
3. If cookie appears then disappears → domain / Secure / SameSite / key mismatch.
4. Network tab: inspect redirects between `/` and `/sign-in` (302 chain).

### D. Confirm which account is used

User mentioned “prefilled username and password” — identify email:

- If **`joe@joeperks.com`**: DB row exists with platform admin flags.
- If **`wearefireflymedia@gmail.com`**: also platform admin in DB, but same email is implicated in org portal conflict (issue 02).

Query after a successful Clerk sign-in (from Clerk Dashboard user id):

```bash
cd packages/db && PRISMA_DATABASE_PROFILE=production bun -e "
import './load-env-bootstrap';
import { PrismaClient } from './generated/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;
const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
for (const email of ['joe@joeperks.com', 'wearefireflymedia@gmail.com']) {
  console.log(email, await p.user.findUnique({ where: { email }, select: { externalAuthId: true, role: true, isPlatformAdmin: true } }));
}
await p.\$disconnect();
"
```

Compare `externalAuthId` to admin Clerk user id.

### E. Middleware

- `apps/admin/proxy.ts` exports `clerkMiddleware` via `@repo/auth/proxy`.
- Matcher includes all non-static routes — expected.

---

## Resolution paths

| Root cause | Fix |
|---|---|
| `pk_test_` / `sk_test_` on production admin | Replace with **admin live** Clerk keys; redeploy |
| DNS not verified | Complete Clerk DNS for admin instance |
| Key pair from wrong Clerk app | Paste matching pk/sk from admin Clerk production |
| Clerk user id ≠ DB `externalAuthId` | Update `User.externalAuthId` for that admin email **after** live keys work, or sign up fresh admin user and promote in DB |
| Residual session from old keys | Clear cookies / use incognito after deploy |

Optional hardening (code — separate PR):

- Surface Clerk errors instead of silent redirect loops.
- Add health check page showing session + DB admin match for debugging (protect or remove after launch).

---

## Verification (definition of done)

- [ ] Sign in at `https://admin.joeperks.com/sign-in` lands on `/` **without** redirect loop
- [ ] Session cookie persists across refresh
- [ ] Platform admin sees nav (Admin home, Approvals, etc.)
- [ ] Non-admin Clerk user (if tested) sees **Access denied** — not a loop
- [ ] Vercel production env shows `pk_live_` / `sk_live_` for admin project

---

## Workaround while fixing

If `joe@joeperks.com` admin account works after key fix but `wearefireflymedia@gmail.com` does not, use **`joe@joeperks.com`** for admin tasks and reserve a **different email** for org portal (issue 02).

---

## Files to inspect when implementing fixes

| Path | Why |
|---|---|
| `apps/admin/proxy.ts` | Clerk middleware |
| `apps/admin/app/(authenticated)/layout.tsx` | Redirect vs access denied |
| `apps/admin/app/(authenticated)/_lib/require-platform-admin.ts` | Admin authorization |
| `apps/admin/app/(authenticated)/_lib/platform-admin.ts` | `isPlatformAdminUser` |
| `packages/auth/keys.ts` | Env validation |
| `.vercel/env/admin.production.env` | Template (verify against live Vercel) |
| `docs/runbooks/sandbox-to-production-cutover.md` | Admin Clerk cutover checklist |
