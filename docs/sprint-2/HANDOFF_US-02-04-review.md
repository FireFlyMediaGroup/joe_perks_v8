# Handoff — Review US-02-04 (Roaster products, UploadThing, sidebar)

**Purpose:** Give this entire document to a reviewer (human or coding agent) to validate Sprint 2 story **US-02-04** and its follow-ups: product/variant CRUD, UploadThing image uploads, portal sidebar, and documentation sync.

**Story:** `docs/sprint-2/stories/US-02-04-product-variant-creation.md` (status: Done, revision 0.4).

**Review status:** **PASS** — reviewed 2026-03-30. No must-fix issues. 13/13 smoke tests pass. See review results and smoke test sections below.

---

## What shipped (summary)

1. **Product & variant CRUD** in `apps/roaster` — list, create, detail, edit; Zod validation; server actions with tenant isolation (`requireRoasterId`) and soft deletes; deleting a product soft-deletes its variants in one transaction.
2. **Prisma migration** `20260330180000_add_product_display_fields` — optional `description`, `origin`, `imageUrl` on `Product`.
3. **UploadThing** — `app/api/uploadthing/` (`productImage` route), Clerk + roaster profile gate; `lib/uploadthing.ts`; `product-image-field.tsx` (upload + URL fallback); `NextSSRPlugin` in `(authenticated)/layout.tsx`; Tailwind `@import "uploadthing/tw/v4"`; Next image patterns for `utfs.io` / `ufs.sh`; env `UPLOADTHING_TOKEN` in `apps/roaster/env.ts` and docs.
4. **Sidebar** — Replaced next-forge demo nav with portal links (Dashboard, Payments → `/onboarding`, Products, Shipping, Payouts, Webhooks) and an **Account** section using Clerk `useUser` + `UserButton`.
5. **Intentionally not done:** Hiding `DRAFT` products from campaign selection remains **future** (one AC left unchecked in the story).

---

## Review prompt (copy-paste)

```
You are reviewing completed work for Joe Perks Sprint 2 / US-02-04 (roaster product catalog, UploadThing, sidebar).

Goals:
1. Confirm implementation matches the story ACs and `docs/AGENTS.md` (money as cents, tenant isolation, soft deletes, no PII in logs).
2. Confirm all listed documentation reflects the codebase.
3. Note gaps, risks, or follow-ups.

Scope — primary code:
- apps/roaster/app/(authenticated)/products/ (pages, _actions, _components, _lib)
- apps/roaster/app/api/uploadthing/ (core.ts, route.ts)
- apps/roaster/lib/uploadthing.ts
- apps/roaster/app/(authenticated)/components/sidebar.tsx
- apps/roaster/app/(authenticated)/layout.tsx (NextSSRPlugin)
- apps/roaster/app/styles.css (uploadthing/tw/v4)
- apps/roaster/next.config.ts (image remotePatterns)
- apps/roaster/env.ts (UPLOADTHING_TOKEN)
- packages/db: prisma/schema Product fields + migration 20260330180000_add_product_display_fields

Scope — documentation (verify narrative + links):
- docs/sprint-2/stories/US-02-04-product-variant-creation.md
- docs/sprint-2/README.md
- docs/SPRINT_2_CHECKLIST.md (Phase 6 + Roaster shell section)
- docs/SPRINT_2_PROGRESS.md (tracker 0.10)
- docs/01-project-structure.mermaid (roaster products + api/uploadthing)
- docs/AGENTS.md (apps/roaster .env — UPLOADTHING_TOKEN)
- docs/SCAFFOLD_PROGRESS.md (revision 1.11)
- Root .env.example (roaster UPLOADTHING_TOKEN)

Verification suggestions:
- pnpm --filter roaster exec biome check on changed paths (or pnpm check if repo is clean).
- With DATABASE_URL and Clerk: sign in as roaster, create product + variants, soft-delete, confirm tenant isolation conceptually in code.
- With UPLOADTHING_TOKEN set in apps/roaster/.env.local: upload product image, confirm imageUrl populated and thumbnails load.
- Without token: confirm URL-only image path still works and helper text mentions UPLOADTHING_TOKEN.

Deliverable: Short review notes — pass/fail per area, any must-fix issues, optional improvements.
```

---

## Review results (2026-03-30)

**Overall verdict: PASS** — no must-fix issues.

| Area | Verdict | Notes |
|------|---------|-------|
| Product CRUD (actions, pages, lib) | PASS | Tenant isolation via `requireRoasterId()`, soft deletes with `deletedAt: null` filter, Zod validation, product delete cascades to variants in `$transaction` |
| UploadThing integration | PASS | Clerk + roaster profile gate in middleware, 4MB image limit, URL fallback when token unset, SSR plugin in layout |
| Sidebar + layout | PASS | Portal nav with active-state detection, Clerk account footer, mode toggle retained |
| Prisma schema + migration | PASS | `description`, `origin`, `imageUrl` as optional fields; additive migration |
| Config (env.ts, next.config, styles, package.json) | PASS | `UPLOADTHING_TOKEN` optional with empty-to-undefined, image remote patterns for `utfs.io`/`ufs.sh`, Tailwind v4 import |
| Documentation sync | PASS | All 8 docs (story, README, checklist, progress, mermaid, AGENTS.md, SCAFFOLD_PROGRESS, .env.example) accurate |
| AGENTS.md rules compliance | PASS | Money as cents, tenant isolation, soft deletes, no PII — all verified in code |
| Typecheck | PASS | Zero errors in US-02-04 code (pre-existing Sentry SDK type issues in `packages/observability/` only) |

### Optional improvements noted (non-blocking)

1. Forms use `onClick` instead of `<form onSubmit>` — Enter-to-submit doesn't work in fields.
2. `ProductFormInput` type is the Zod output type; could be fragile if transforms become complex.
3. `zodFirstMessage()` helper duplicated in both action files — consider extracting to `_lib/`.
4. Images rendered with `unoptimized` — acceptable for MVP, revisit for perf.
5. No `loading.tsx` or `Suspense` skeletons on list/detail pages.

### Post-review documentation updates

- `docs/AGENTS.md`: Added `requireRoasterId()` to tenant isolation section.
- `docs/CONVENTIONS.md`: Added server action pattern, portal route structure, dollar-to-cents form input, fixed missing `roaster-rejected.tsx` in template listing.

---

## Smoke tests (2026-03-30)

Script: `packages/db/scripts/smoke-products.ts` — run with `cd packages/db && bun run scripts/smoke-products.ts`.

| # | Test | Result |
|---|------|--------|
| 1 | Product model queryable | PASS |
| 2 | ProductVariant model queryable | PASS |
| 3 | Product display fields (description, origin, imageUrl) exist | PASS |
| 4 | ProductVariant price + filter fields exist | PASS |
| 5 | Product soft-delete filter (`deletedAt: null`) works | PASS |
| 6 | ProductVariant soft-delete filter works | PASS |
| 7 | Product tenant-scoped query (`roasterId` filter) works | PASS |
| 8 | GET `/products` route registered (auth enforced) | PASS |
| 9 | GET `/products/new` route registered (auth enforced) | PASS |
| 10 | GET `/api/uploadthing` route registered | PASS |
| 11 | No orphan products (all have `roasterId`) | PASS |
| 12 | No active variants violating `retail > wholesale` | PASS |
| 13 | Migration `20260330180000_add_product_display_fields` applied | PASS |

**13/13 passed, 0 failed.**

---

## Env quick reference

| Variable | App | Purpose |
|----------|-----|---------|
| `UPLOADTHING_TOKEN` | `apps/roaster/.env.local` | Enables UploadThing; from [uploadthing.com](https://uploadthing.com/dashboard) |
| `DATABASE_URL` | root / packages/db | Required for product CRUD |
| Clerk keys | `apps/roaster/.env.local` | Required for portal + upload auth |

---

## Dependency versions added (roaster)

- `uploadthing`, `@uploadthing/react` (see `apps/roaster/package.json`).

---

## Revision log (this handoff doc)

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-30 | Initial handoff for US-02-04 + follow-ups review. |
| 0.2 | 2026-03-30 | Review completed: PASS. Added review results, smoke tests (13/13), optional improvements. Post-review doc updates to AGENTS.md + CONVENTIONS.md. |
