# US-02-06 — Slug Reservation Blocklist Validation

**Story ID:** US-02-06 | **Epic:** EP-02 (Roaster Onboarding)
**Points:** 3 | **Priority:** Medium
**Status:** `Done`
**Owner:** Backend
**Dependencies:** US-01-02 (DB Foundation)
**Depends on this:** US-03-01 (Org Application Form)

---

## Goal

Create an API route that validates org storefront slugs against two sources: the `RESERVED_SLUGS` blocklist (marketing routes that must not be claimed) and the database (existing `Org.slug` and pending `OrgApplication.desiredSlug` values). This endpoint powers real-time slug validation in the org application form (US-03-01).

---

## Diagram references

- **Project structure:** [`docs/01-project-structure.mermaid`](../../01-project-structure.mermaid) — `[slug]/` route in `apps/web` (storefront); slug must not collide with fixed marketing routes
- **Database ERD:** [`docs/06-database-schema.mermaid`](../../06-database-schema.mermaid) — `Org.slug` (unique), `OrgApplication.desiredSlug` (unique)

---

## Current repo evidence

- `packages/types/src/slugs.ts` exports `RESERVED_SLUGS`: `["api", "blog", "contact", "legal", "orgs", "pricing", "roasters", "terms", "privacy-policy"]`
- `Org` model has `slug String @unique`
- `OrgApplication` model has `desiredSlug String @unique`
- No existing validation API route
- `apps/web` uses `[locale]/[slug]/` for org storefronts — slug collisions with marketing routes would break routing

---

## AGENTS.md rules that apply

- **No PII logging:** The slug itself is not PII, but do not log request details beyond the slug being validated.
- No special money, tenant isolation, or Stripe rules apply to this story.

**CONVENTIONS.md patterns:**
- API route structure: `export async function GET(req: Request)` returning `Response.json()`
- Error responses: `{ error: string, code: string }` with HTTP status
- Validated inputs parsed before use

---

## In scope

- API route at `apps/web/app/api/slugs/validate/route.ts`
- Accepts `slug` as a query parameter (`GET /api/slugs/validate?slug=my-org`)
- Validates the slug format: lowercase, alphanumeric + hyphens only, 3-63 characters, no leading/trailing hyphens
- Checks against `RESERVED_SLUGS` from `@joe-perks/types`
- Checks database uniqueness: `Org.slug` and `OrgApplication.desiredSlug` (where application status is not `REJECTED`)
- Returns JSON: `{ available: boolean, reason?: string }`
- Rate limiting to prevent slug enumeration (lightweight — 30 requests per minute per IP)

---

## Out of scope

- Reserving or holding a slug (it's validated on check and claimed on application submission)
- Admin ability to release or reassign slugs
- Custom domain mapping for orgs (Phase 3)
- Profanity filtering (can be added later)

---

## Primary files to create or modify

| Action | File | Purpose |
|--------|------|---------|
| Create | `apps/web/app/api/slugs/validate/route.ts` | GET route — validates slug availability |
| Modify | `packages/types/src/slugs.ts` | Add slug format validation utility (optional — or keep in the route) |
| Create | `packages/types/src/slug-validation.ts` | Shared slug validation logic (format + blocklist check) |

---

## Acceptance criteria

- [x] `GET /api/slugs/validate?slug=my-coffee-org` returns `{ available: true }` for a valid, unclaimed slug
- [x] Returns `{ available: false, reason: "reserved" }` for slugs in `RESERVED_SLUGS`
- [x] Returns `{ available: false, reason: "taken" }` for slugs matching an existing `Org.slug`
- [x] Returns `{ available: false, reason: "pending" }` for slugs matching a pending/approved `OrgApplication.desiredSlug`
- [x] Returns `{ available: false, reason: "invalid_format" }` for slugs that don't match the format rules (too short, uppercase, special chars, etc.)
- [x] Slug format: lowercase `a-z`, digits `0-9`, hyphens `-`, 3-63 characters, no leading/trailing hyphens
- [x] Missing `slug` query param returns 400 with `{ error: "slug parameter required" }`
- [x] Rate limiting: 30 requests per minute per IP (prevents enumeration)
- [x] Route is public (no auth required — org applicants haven't signed up yet)

---

## Suggested implementation steps

1. Create a slug validation utility in `packages/types/src/slug-validation.ts`:
   - `isValidSlugFormat(slug: string): boolean` — regex for `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$` (3-63 chars)
   - `isReservedSlug(slug: string): boolean` — checks against `RESERVED_SLUGS`
   - Export both for reuse in the API route and the org apply form server action
2. Create the API route at `apps/web/app/api/slugs/validate/route.ts`:
   - Parse `slug` from URL search params
   - Validate format
   - Check reserved list
   - Query `Org` table for existing slug
   - Query `OrgApplication` table for pending/approved applications with that `desiredSlug`
   - Return availability result
3. Add lightweight rate limiting (reuse Upstash from `@joe-perks/stripe` or create a dedicated limiter).
4. Update `packages/types/src/index.ts` to export the new validation utilities.
5. Test: reserved slug → unavailable, taken slug → unavailable, valid new slug → available, invalid format → rejected.

---

## Handoff notes

- US-03-01 (Org Application Form) will call this endpoint for real-time slug validation as the user types. The form should debounce calls (300ms+).
- The slug validation utility in `packages/types` should be importable by both the API route and the server action in the org apply form for consistent validation.
- When `OrgApplication` is rejected, its `desiredSlug` should no longer block other applicants. The DB query should filter: `WHERE desiredSlug = slug AND status NOT IN ('REJECTED')`.

---

## Revision log

| Version | Date | Notes |
|---------|------|-------|
| 0.1 | 2026-03-29 | Initial story created for Sprint 2 planning. |
| 0.2 | 2026-03-29 | Implemented: `packages/types/src/slug-validation.ts` (`isValidSlugFormat`, `isReservedSlug`), `apps/web/app/api/slugs/validate/route.ts` (GET with format/reserved/DB checks + Upstash rate limiting). |
| 0.3 | 2026-03-29 | Smoke test fixes: (1) regex changed from `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$` to `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$` to enforce 3-char minimum (old regex allowed 1-char slugs). (2) Rate limiting moved from inline `@upstash/ratelimit` to `limitSlugValidation()` in `@joe-perks/stripe` (Upstash not a direct dep of `apps/web`). All 11 smoke tests passing. |
