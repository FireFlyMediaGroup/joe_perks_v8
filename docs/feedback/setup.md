# Feedback Setup — Featurebase

**Status**: Implementation step. Independent of the credential cutover (one Featurebase org
spans environments). Free-tier-friendly for beta. Part of go-live strategy — see
[`./README.md`](./README.md) and [`./full-implementation-plan.md`](./full-implementation-plan.md).
**Owner**: Eng lead.
**Last updated**: 2026-06-05

## Goal

Give beta users a first-class way to **report bugs, request features, browse a help center, and
see a changelog** — targeting **all surfaces** (storefront + roaster + org + admin), identified
where we have a Clerk session. Mirrors the BetterStack pattern: a small workspace package
(`@repo/feedback`) with `keys.ts` + an env-gated client widget, wired per app.

## Related

- [`./README.md`](./README.md) — integration hub + scope/vision
- [`../runbooks/sandbox-to-production-cutover.md`](../runbooks/sandbox-to-production-cutover.md) §14 — env-var rows
- [`../runbooks/observability-setup.md`](../runbooks/observability-setup.md) — the sibling integration this mirrors

## What the package provides

`packages/feedback/`:

- `keys.ts` — `@t3-oss/env-nextjs` validation for the three env vars below.
- `widget.tsx` — `<FeedbackWidget>` client component. **Self-gating**: renders nothing and
  loads no script when `NEXT_PUBLIC_FEATUREBASE_ORG` is unset (same pattern as the
  Liveblocks/BetterStack scaffolding), so it is safe to leave mounted anywhere.
- `identify.ts` — `buildFeedbackIdentity()` server helper to attribute posts to the Clerk user.

## Environment variables

| Var | Scope | Meaning |
|---|---|---|
| `NEXT_PUBLIC_FEATUREBASE_ORG` | client | Featurebase org subdomain (the `xxxx` in `xxxx.featurebase.app`). Drives the widget. |
| `FEATUREBASE_SSO_SECRET` | server | Signs the identity hash so logged-in users are seamlessly identified. Optional. |
| `FEATUREBASE_API_KEY` | server | Featurebase REST API key (server-side post creation). Optional. |

> ⚠️ **Confirm the exact SDK call signatures, help-center embed, and identity-verification (SSO)
> scheme against the current Featurebase docs** (https://help.featurebase.app) before enabling in
> production — same "verify at setup time" caveat we applied to the BetterStack Logs source-token
> var. The committed code follows the documented embed but is marked for confirmation.

## Implementation checklist

### A. Create the Featurebase organization
- [ ] Create the Joe Perks Featurebase org; note the subdomain → `NEXT_PUBLIC_FEATUREBASE_ORG`
- [ ] Configure boards: **Bugs**, **Feature requests**; enable the **Changelog**; set up the **Help center**
- [ ] (Optional) generate the SSO secret → `FEATUREBASE_SSO_SECRET`, and an API key → `FEATUREBASE_API_KEY`

### B. Mount the widget — everywhere
- [ ] Add `@repo/feedback` as a dependency of each app that mounts it; run `pnpm install`
- [ ] **Portals** (`roaster`, `org`, `admin`): render `<FeedbackWidget identity={...} />` in the authenticated layout, with `identity` from `buildFeedbackIdentity()` (Clerk session + roaster/org name as `companyName`)
- [ ] **Storefront** (`web`): render `<FeedbackWidget />` anonymously; add `NEXT_PUBLIC_FEATUREBASE_ORG` to the `web` allowlist + env files (currently allowlisted for roaster/org/admin only)
- [ ] Add `NEXT_PUBLIC_FEATUREBASE_ORG` (+ `FEATUREBASE_SSO_SECRET` if used) to the matching `.vercel/env/<project>.{preview,production}.env`

### C. Help center + changelog
- [ ] Decide hosted Featurebase help center vs. own docs surface (see README open questions)
- [ ] Add a "What's new" changelog launcher in portal headers
- [ ] Verify identity dedupes correctly (same user → one Featurebase profile)

## Verify
- [ ] Widget launcher appears on storefront + each portal; hidden where the org var is unset
- [ ] A submitted bug/feature post appears in the board; attributed to the user in portals, anonymous on storefront
- [ ] Changelog + help center render

## Free tier
Featurebase's free tier covers a public board + widget for a beta. Revisit paid when you need
private boards, SSO at scale, the hosted help center, or advanced moderation/integrations.
