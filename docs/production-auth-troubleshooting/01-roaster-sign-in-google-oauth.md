# Issue 01 — Roaster portal Google sign-in fails

**Portal:** `https://roasters.joeperks.com/sign-in`  
**App:** `apps/roaster`  
**Status:** ✅ **RESOLVED 2026-06-29** — root cause was an **invalid Google OAuth Client Secret in Clerk** (`invalid_client` at token exchange). After re-entering the correct secret, Google sign-in succeeds end-to-end (verified via in-IDE browser: authenticated as `chris@chrisodomphoto.com`, `/dashboard` loads "Orders for Sunrise Coffee Roasters"). Dangling unverified Google identity cleaned up. Only remaining item: redeploy roaster so `/` redirects to `/dashboard` (cosmetic 404).  
**Priority:** Fix first (blocks roaster Connect onboarding and smoke lane)

---

## TL;DR (2026-06-29 resolution)

Three distinct problems were tangled together. Resolved/explained:

| # | Problem | Status | Fix |
|---|---------|--------|-----|
| 1 | **Password required** on fresh prod Clerk blocked OAuth sign-up | ✅ Fixed | Dashboard → password **not required** |
| 2 | **No webhook** on prod instance → DB never merged `clerk_pending:` | ✅ Fixed | Dashboard webhook → `…/api/webhooks/clerk`; merge confirmed (`externalAuthId` now `user_3Fn7O…`) |
| 3 | **404 at `/`** after sign-in | ✅ Fixed in code (needs redeploy) | Root page was next-forge boilerplate that `notFound()`s without a Clerk org; replaced with redirect to `/dashboard` |
| 4 | **Google sign-in fails: invalid Google OAuth Client Secret in Clerk** (`oauth_token_exchange_error` → `invalid_client`) | ✅ **Fixed & verified** | Correct **Client Secret** re-entered on the roaster Clerk instance → Google sign-in now completes (verified Google identity `idn_3FnED5…`, `/dashboard` loads). Dangling unverified identity deleted. |

**Current working path:** email address → emailed code → lands on `/` (redirects to `/dashboard` after deploy). DB `User` for `chris@chrisodomphoto.com` is correctly linked (`externalAuthId = user_3Fn7OPtIWz75vKEyRYO5V2az2u2`, `roasterId` intact).

See **[Hardening the new roaster workflow](#hardening-the-new-roaster-workflow)** below so future roasters never hit any of this.

---

## Investigation log (2026-06-29)

| Check | Result |
|---|---|
| Live site Clerk key | `pk_live_…` for `clerk.roasters.joeperks.com` (prod instance `ins_3Fk9nOJVGt1m1roVE24W6FlkI3R`) |
| Clerk DNS | `clerk.roasters.joeperks.com` → Clerk services ✓ |
| Google OAuth redirect | Starts correctly → Google consent ✓ |
| After Google consent | Returns to `/sign-in` with **“Unable to complete action…”**; **0 Clerk users created** |
| Prod Clerk `user_settings.attributes.password` | **`required: true`** — sign-up form shows required Password field |
| DB `User.externalAuthId` (current) | `clerk_pending:cmo7y03kt00018np0w5rts3mw` (correct for webhook merge) |
| Roaster prod Clerk users (current) | **0** (API-created user deleted — it had no Google link) |
| Clerk webhooks on prod instance | **None registered** — webhook merge will not run until Dashboard endpoint added |
| Vercel roaster Clerk env | Live keys present ✓ |

### DEFINITIVE root cause (2026-06-29) — invalid Google OAuth **Client Secret** in Clerk

Pulled the actual error directly from the Clerk **Backend API** (`GET /v1/users/{id}` with the roaster prod `sk_live_…`). After the user connected Google from the account portal, the user record gained a Google identity — but it is **`unverified`** with the exchange error attached:

```jsonc
// user_3Fn7OPtIWz75vKEyRYO5V2az2u2 → external_accounts[0]
{
  "provider": "oauth_google",
  "email_address": "",          // empty — Clerk never received the profile
  "approved_scopes": "",        // empty — token never issued
  "verification": {
    "status": "unverified",
    "strategy": "oauth_google",
    "error": {
      "code": "oauth_token_exchange_error",
      "message": "Token exchange error",
      "long_message": "oauth: token exchange: oauth2: \"invalid_client\" \"The provided client secret is invalid.\""
    }
  }
}
```

**What actually happens in the flow:**

1. User clicks **Continue with Google** → Google consent succeeds (Client **ID** and redirect URI are valid).
2. Google redirects back to `https://clerk.roasters.joeperks.com/v1/oauth_callback` with an authorization **code**.
3. Clerk tries to exchange the code for a token using the stored **Client Secret** → Google returns **`invalid_client` — “The provided client secret is invalid.”**
4. No token → no `userinfo` → empty email / empty scopes → external account stays `unverified` → UI shows the generic **“Unable to complete action at this time.”**

This is why the **earlier account-linking / “missing email_address” theory was wrong** — those were *downstream symptoms* of a failed token exchange (Clerk never got the email because the token call failed), not a collision. Connecting Google from the account portal could not help either: the link itself can’t complete.

The Client Secret was entered during `clerk deploy --mode human` (terminal: “Google OAuth Client Secret”). It does **not** match the secret on the Google Cloud OAuth client `886727922325-vugstv1m2be82niq7cijgool08g9hgm2.apps.googleusercontent.com` (typo, wrong client, or the secret was rotated in Google Cloud afterwards).

**Fix:**

1. Google Cloud Console → APIs & Services → Credentials → the OAuth 2.0 Client used for `roasters.joeperks.com` → **copy the Client Secret** (or **Reset/Add secret** to get a fresh one).
2. Clerk Dashboard → [roaster prod instance](https://dashboard.clerk.com/apps/app_3BMq2kQBOINXPR9lSZf64gwkMLE/instances/ins_3Fk9nOJVGt1m1roVE24W6FlkI3R) → **Configure → SSO connections → Google → Use custom credentials** → paste the **correct Client ID + Client Secret** → save. (Or re-run `clerk deploy` and re-enter the secret carefully.)
3. Confirm the Authorized redirect URI in Google Cloud is exactly `https://clerk.roasters.joeperks.com/v1/oauth_callback`.
4. Delete the dangling **unverified** Google identity on `user_3Fn7O…` (so the next sign-in creates a clean link), then retry **Continue with Google**.

Once the secret matches, `email_address required` is satisfied automatically by Google’s verified email and sign-in completes — no account-linking change needed.

#### ✅ Verified fixed (2026-06-29)

After the correct Client Secret was entered in Clerk, the full Google flow was re-run in the in-IDE browser and **succeeded**:

- Signed in as `chris@chrisodomphoto.com`; `/dashboard` renders "Orders for Sunrise Coffee Roasters" (roaster-scoped).
- Backend API now shows a single **verified** Google identity: `idn_3FnED5Ms7v02ylBNM4kuJznLunV` (email `chris@chrisodomphoto.com`, `provider_user_id 115582202992608775359`, `status: verified`, no error).
- The old broken identity (`idn_3FnCZK…`, empty email, `oauth_token_exchange_error`) was **deleted** via `DELETE /v1/users/{id}/external_accounts/eac_3FnCZMI5OVSYUvqQlgV3XWO837T`. User now has exactly one external account.
- Test session signed out afterward.

Remaining (non-blocking): redeploy `joe-perks-roaster` so `/` redirects to `/dashboard` (the post-sign-in landing still 404s until the code fix ships).

### Root causes (confirmed)

Four distinct problems, resolved in order:

1. **Password required on fresh prod instance (primary blocker):** `clerk deploy` cloned dev settings where **password is required at sign-up**. With **no Clerk user** yet, **Continue with Google** transfers to sign-up, which cannot satisfy `password.required: true` via OAuth alone → generic error, **no user created**. _Fixed: password set to not required._

2. **No webhook on prod instance:** the merge from `clerk_pending:` → real Clerk id never ran. _Fixed: webhook endpoint added; first email-code sign-in created `user_3Fn7OPtIWz75vKEyRYO5V2az2u2` and the webhook merged the pending DB row._

3. **404 at `/` after sign-in:** `apps/roaster/app/(authenticated)/page.tsx` was leftover **next-forge boilerplate** that calls `notFound()` when there is no Clerk **organization**. The roaster portal does not use Clerk orgs (`organization_settings.enabled = false`), so `orgId` is always null and `/` always 404s. Clerk's `after_sign_in_url` is `/`, so every login landed on a 404 (the sidebar still worked because `/dashboard` exists). _Fixed in code: `/` now redirects to `/dashboard`._

4. **Google sign-in fails: invalid Google OAuth Client Secret in Clerk (REAL root cause).** ~~Earlier theory: email collision / account-linking~~ — **disproven** by Backend API evidence. Clerk's token exchange with Google returns `invalid_client` ("The provided client secret is invalid"), so the OAuth callback never completes, no email/profile is fetched, and the UI shows the generic error. See **[DEFINITIVE root cause](#definitive-root-cause-2026-06-29--invalid-google-oauth-client-secret-in-clerk)** above for the exact error payload and fix. **This affects every roaster using Google, not just mixed-method users.**

### Fixes applied (Clerk Dashboard — human steps, done)

Instance: [Joe Perks - Roasters prod](https://dashboard.clerk.com/apps/app_3BMq2kQBOINXPR9lSZf64gwkMLE/instances/ins_3Fk9nOJVGt1m1roVE24W6FlkI3R)

1. ✅ **Configure → User & authentication → Email → Password** → **not required**.
2. ✅ **Configure → Webhooks** → `https://roasters.joeperks.com/api/webhooks/clerk` (`user.created`, `user.updated`); signing secret synced to Vercel `CLERK_WEBHOOK_SECRET`.

### Remaining (optional) — make Google work for mixed-method users

Pick one:

- **Account portal link:** sign in with email code → [accounts.roasters.joeperks.com](https://accounts.roasters.joeperks.com) → **Connect account → Google**. Google sign-in then works for that user.
- **Auto account-linking (recommended):** Clerk Dashboard → **Configure → SSO connections → Google** → enable linking to existing accounts with a matching **verified** email.
- **Clean Google-first reset (test accounts only):** run the repair script below, then sign in with Google first so the account is created with Google already linked.

### Code fix applied (404)

```9:1:apps/roaster/app/(authenticated)/page.tsx
import { redirect } from "next/navigation";
// redirects "/" → "/dashboard"
```

Requires a `joe-perks-roaster` production redeploy. Optionally also set `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard` on Vercel.

### DB repair script (safe reset only — does not create API users)

```bash
JOE_PERKS_CONFIRM_ROASTER_CLERK_REPAIR=1 \
CLERK_SECRET_KEY=sk_live_... \
pnpm repair:roaster-clerk-prod
```

Deletes email-only Clerk users blocking OAuth and resets `externalAuthId` to `clerk_pending:{roasterId}`.

---

## Symptom

On the roaster sign-in page, attempting **Continue with Google** shows a Clerk error banner:

> **Unable to complete action at this time. If the problem persists please contact support.**

User reports Google OAuth worked previously on this portal. Failure occurs at the Clerk UI layer (before the app’s authenticated routes run).

Screenshot reference: user-provided capture at `roasters.joeperks.com/sign-in` (2026-06-28).

---

## Expected behavior

1. User completes Google OAuth against the **roaster production Clerk instance**.
2. Clerk session cookie is set for `roasters.joeperks.com`.
3. If a matching `User` row exists, roaster portal loads (dashboard / onboarding).
4. Clerk `user.created` / `user.updated` webhook may sync `User` in Postgres (merge `clerk_pending:*` by email if applicable).

---

## What we already know (prod DB)

For `chris@chrisodomphoto.com`:

- `User.role = ROASTER_ADMIN`
- `User.roasterId` is set (linked to E2E seed roaster)
- `User.externalAuthId = user_3CeEgLbeev4eBdnKtXWCvIJvIJm` (a real Clerk user id, not `clerk_pending:`)

So this is **probably not** a missing DB merge for the roaster admin. The failure is likely **Clerk configuration, OAuth, or production keys** — not “no roaster linked” (that message appears later on onboarding, not at sign-in).

---

## Likely causes (ranked)

### 1. Roaster Vercel project missing or wrong Clerk keys

- `apps/roaster` requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for the **roaster production Clerk instance** (live `pk_live_` / `sk_live_`, not test keys on production domain).
- Repo template `.vercel/env/roaster.production.env` has these keys **commented out** — confirm they are actually set in the **Vercel `joe-perks-roaster` production** environment.

**Code refs:** `packages/auth/keys.ts`, `apps/roaster/env.ts`

### 2. Google OAuth not enabled or misconfigured on roaster Clerk instance

- In Clerk Dashboard → **roaster production** application → **SSO connections** → Google must be enabled.
- Authorized redirect URIs must include Clerk’s OAuth callback URLs for this instance.
- If Clerk production instance was recently created (`clerk deploy --mode human` in progress), Google may not be copied from dev.

### 3. Clerk DNS / satellite domain not verified for `roasters.joeperks.com`

- Production Clerk instances require DNS (CNAME + DKIM) under the portal subdomain.
- See cutover matrix: [`docs/runbooks/sandbox-to-production-cutover.md`](../runbooks/sandbox-to-production-cutover.md) §1 / §3.
- Unverified domains can cause auth failures or session issues.

### 4. Clerk instance mismatch (dev keys on prod hostname)

- Same class of bug as admin (documented in cutover doc): test keys on a production custom domain often break OAuth and sessions.

### 5. Clerk-side outage or Google account restriction

- Less common; verify [Clerk status](https://status.clerk.com) and try email/password sign-in if enabled to isolate Google-only failures.

---

## Investigation steps

Work top to bottom; stop when root cause is confirmed.

### A. Confirm Vercel production env (roaster project)

1. Vercel → `joe-perks-roaster` → Settings → Environment Variables → **Production**.
2. Verify present and non-empty:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`)
   - `CLERK_SECRET_KEY` (`sk_live_…`)
   - `CLERK_WEBHOOK_SECRET` (`whsec_…`) — needed for user sync, not sign-in itself
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/`
   - `ROASTER_APP_ORIGIN=https://roasters.joeperks.com`
3. Redeploy roaster production after any change.

Compare with repo template: `.vercel/env/roaster.production.env` (may be stale).

### B. Clerk Dashboard — roaster production instance

1. Identify which Clerk application backs `pk_live_…` on Vercel.
2. **Domains:** confirm `roasters.joeperks.com` (or Clerk satellite config) is verified.
3. **Google OAuth:** enabled; note Client ID/secret; check redirect URIs.
4. **Allowed redirect URLs / Authorized origins** include:
   - `https://roasters.joeperks.com`
   - Clerk-hosted URLs for this instance
5. Review **Logs** in Clerk around the failed attempt (timestamp from user).

### C. Browser / network evidence

1. Reproduce with DevTools → Network filtered to `clerk` / `google`.
2. Capture failed request status + response body (Clerk often returns a more specific error in JSON).
3. Check Application → Cookies for `__session` (or Clerk session cookie) on `.joeperks.com` / `roasters.joeperks.com` after attempted sign-in.

### D. Optional — DB sanity (already healthy for chris@)

```bash
# From repo root, with packages/db/.env.production
cd packages/db && PRISMA_DATABASE_PROFILE=production bun -e "
import './load-env-bootstrap';
import { PrismaClient } from './generated/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
neonConfig.webSocketConstructor = ws;
const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const u = await p.user.findUnique({ where: { email: 'chris@chrisodomphoto.com' } });
console.log(u);
await p.\$disconnect();
"
```

Expect `roasterId` set. If sign-in later succeeds but onboarding fails, switch to issue 02 patterns.

### E. Webhook health (follow-up, not sign-in blocker)

- Clerk Dashboard → Webhooks → endpoint `https://roasters.joeperks.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`
- Confirm recent deliveries are 200 (`apps/roaster/app/api/webhooks/clerk/route.ts`)

---

## Resolution paths

| Root cause | Fix |
|---|---|
| **Password required on prod Clerk** (primary) | Dashboard → User & authentication → Email → Password → **not required** |
| Email-only Clerk user blocks Google link | Run `pnpm repair:roaster-clerk-prod` (deletes API user, resets `clerk_pending:`) |
| No webhook on prod instance | Dashboard → Webhooks → `https://roasters.joeperks.com/api/webhooks/clerk` + Vercel secret |
| Missing/wrong Clerk keys on Vercel | Set roaster **production** live keys; redeploy |
| Google OAuth off or bad redirect | Enable/configure Google on roaster Clerk instance |
| DNS not verified | Complete Clerk DNS for roaster instance per cutover runbook |
| Dev keys on prod | Replace with live keys from roaster Clerk production instance |

**Do not** create Clerk users via Backend API for accounts that should sign in with Google.

---

## Verification (definition of done)

- [x] Email-code sign-in on `https://roasters.joeperks.com/sign-in` completes and creates a Clerk user
- [x] Webhook merges `clerk_pending:` → real `user_…` (`externalAuthId = user_3Fn7O…`, `roasterId` intact)
- [x] Root page no longer 404s (code fix → redirect `/` → `/dashboard`; **redeploy required to ship**)
- [ ] Roaster production redeployed so `/` redirect is live
- [x] Google sign-in works end-to-end (fixed invalid Client Secret; verified `/dashboard` loads 2026-06-29)
- [ ] (Follow-up) Roaster onboarding page loads Connect UI — may expose separate Stripe issues

---

## Files to inspect when implementing fixes

| Path | Why |
|---|---|
| `apps/roaster/proxy.ts` | Clerk middleware |
| `apps/roaster/app/api/webhooks/clerk/route.ts` | User sync after sign-in |
| `packages/db/clerk-user-sync.ts` | Pending user merge |
| `packages/auth/keys.ts` | Required env vars |
| `docs/VERCEL_PRODUCTION_PREVIEW_SETUP.md` | Roaster env block |
| `docs/runbooks/sandbox-to-production-cutover.md` | Clerk cutover + DNS |

---

## Hardening the new roaster workflow

Goal: a roaster who is approved **after** this incident never hits password-required, 404, webhook, or account-linking problems. Ordered by leverage.

### How the workflow works today

```
Apply (joeperks.com/roasters/apply)
  → RoasterApplication PENDING_REVIEW          (no User yet)
Admin approves (admin portal)
  → Roaster ONBOARDING + User ROASTER_ADMIN
    with externalAuthId = clerk_pending:{uuid} (random UUID today)
  → roaster-approved email → /sign-in
Roaster first sign-in (Clerk: Google or email code)
  → Clerk user.created/updated webhook
  → upsertUserFromClerkWebhook merges clerk_pending: row BY EMAIL
  → externalAuthId becomes real user_… ; dashboard loads
```

The design is sound. The failures above were **platform/config**, not the merge logic. Harden both layers.

### Tier 0 — Platform config (every Clerk prod instance, after each `clerk deploy`)

Codify this as a post-cutover checklist (roaster, org, admin):

- [ ] Password **not required** at sign-up (OAuth-first portals)
- [ ] Google SSO enabled with **production** Google Cloud credentials; OAuth consent screen **In production** (not Testing)
- [ ] **Account linking** enabled for Google (link to existing verified-email accounts)
- [ ] Webhook endpoint registered → `…/api/webhooks/clerk` with `user.created`, `user.updated`
- [ ] `CLERK_WEBHOOK_SECRET` synced to the matching Vercel project; redeploy
- [ ] One real Google sign-in smoke on the prod domain
- [ ] **Never** create API-only Clerk users for accounts expected to use Google

### Tier 1 — Code hardening (low risk, high value)

1. **Fix the post-sign-in landing (done):** `apps/roaster/app/(authenticated)/page.tsx` redirects `/` → `/dashboard`. Prevents the org-gated 404. Apply the same audit to `apps/org` root page.

2. **Standardize the pending id.** `approve-application.ts` uses `generatePendingClerkExternalAuthId()` (random UUID) while seeds use `clerk_pending:{roasterId}`. Make approval also use `clerk_pending:{roasterId}` for easier support/repair correlation.
   - File: `apps/admin/app/(authenticated)/approvals/roasters/_actions/approve-application.ts`

3. **Make approve idempotent against pre-approval sign-ups.** If a person Clerk-signs-up **before** approval, a `User` row may already exist by email → the approval `user.create` throws `P2002`. Change to **upsert by email**:
   - If `User` exists for `application.email`: set `roasterId`, `role = ROASTER_ADMIN` (keep real `externalAuthId` if already linked, else `clerk_pending:{roasterId}`).
   - Else create as today.
   - Files: `approve-application.ts`, `packages/db/clerk-user-sync.ts` (reuse merge helpers).

### Tier 2 — Stronger B2B gate (recommended before beta)

1. **Restrict public sign-up on the roaster portal.** It is invite/approval-only, not open registration.
   - Clerk: set sign-up to **restricted** (or invitation-only).
   - App: redirect `/sign-up` → `/sign-in` with copy “Accounts are created after application approval.”
   - File: `apps/roaster/app/(unauthenticated)/sign-up/[[...sign-up]]/page.tsx`

2. **Send a Clerk invitation on approval** (instead of relying on the roaster to self-serve sign-up):
   - On approve, call Clerk Invitations API for `application.email` with `public_metadata: { roasterId }`.
   - The webhook still merges by email; metadata is a backup that lets the webhook set `roasterId` even if the email match ever fails.
   - New helper, e.g. `packages/auth/clerk-invitations.ts`; call from `approve-application.ts`.
   - Update `roaster-approved` email to reference the invitation.

### Tier 3 — UX + observability (later)

1. **Pending-link state UX.** When a Clerk session exists but `User.externalAuthId` is still `clerk_pending:` (webhook delay/failure), show a “Finishing account setup…” page with retry + support, instead of the generic `NoRoasterProfile` (“No roaster profile is linked”).
   - Files: `apps/roaster/app/(authenticated)/products/_components/no-roaster-profile.tsx`, `require-roaster.ts`, `onboarding/page.tsx`.

2. **Log webhook merge outcomes** (application id only, no PII) so support can answer “signed in but no roaster” fast.

3. **Pre-beta gate:** add a checklist row “an approved roaster can sign in (Google + email) and reach `/dashboard` within 5 minutes.”

### Definition of done (future-roaster-proof)

- [ ] New approved roaster can sign in via **Google** OR **email code** on first try
- [ ] Lands on `/dashboard` (no 404)
- [ ] `clerk_pending:` row merges to real `user_…` automatically via webhook
- [ ] Pre-approval Clerk sign-up does not break later approval
- [ ] Post-`clerk deploy` checklist exists in the cutover runbook

---

## Notes for downstream issues

Once roaster sign-in works, proceed to **Stripe Connect onboarding** on the roaster portal. Placeholder `acct_e2e_*` ids on the seed roaster may still block live Connect until real accounts are created (see smoke lane runbook).
