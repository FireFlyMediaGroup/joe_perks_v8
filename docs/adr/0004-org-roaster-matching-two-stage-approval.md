# Org onboarding: two-stage approval and a primary-plus-one-backup match

An org joins through a two-stage approval, and is matched to exactly one roaster via a capped
priority list:

- **Stage 1 — platform review.** An org application is `PENDING_PLATFORM_REVIEW`. A platform admin
  approves it, which moves it to `PENDING_ROASTER_APPROVAL` and emails the primary roaster a
  `ROASTER_REVIEW` magic link.
- **Stage 2 — roaster review.** The chosen roaster approves or declines the org. The roaster has
  genuine veto power over which orgs sell its coffee — this is deliberate, because the roaster's brand
  and fulfillment capacity are on the line.

The match uses a **primary + single backup** chain, not an arbitrary cascade:

- The application form creates at most two `RoasterOrgRequest` rows: `priority` 1 (primary) and an
  optional `priority` 2 (backup).
- On approval, the primary (priority 1) is asked first. If the primary declines, `declineOrg` routes
  to priority 2. If the backup also declines, the application is **rejected** — there is no priority
  3+.

The `RoasterOrgRequest.priority` column is a general integer, but it is intentionally only ever `1`
or `2`. We chose the cap (over a full ranked cascade) because orgs are small and a single backup is
enough resilience for v1, and over no-backup because the self-healing decline flow is cheap and
already built.

## Consequences

- This is **already consistent end to end** in code (`submit-application.ts` creates only priority 1
  and 2; `approve-application.ts` asks priority 1; `decline-org.ts` routes to priority 2 then
  rejects). No code change is required.
- The general `priority Int` could mislead a future reader into building a P3+ cascade. Do not — the
  cap is intentional. If a deeper chain is ever wanted, change `decline-org.ts` to find the *next*
  pending priority (it currently hardcodes `priority: 2`) and raise the application-form cap together.
