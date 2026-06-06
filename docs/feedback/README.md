# Feedback & Help Center (Featurebase) — Integration Hub

**Status**: 🚧 Scaffolded, not fully specced. Code skeleton exists; full design + rollout is a
**go-live-strategy item** to revisit (see [`./full-implementation-plan.md`](./full-implementation-plan.md)).
**Last updated**: 2026-06-05

This folder is the home for the Featurebase integration — user **bug reports**, **feature
requests**, **changelog**, and **help center**. It is intentionally a scaffold with notes, not
a finished spec.

## Docs in this folder

- [`./setup.md`](./setup.md) — the implementation checklist (org/boards, env vars, mounting, identify).
- [`./full-implementation-plan.md`](./full-implementation-plan.md) — **stub** to be fleshed out into the full spec + rollout plan later.

## Scope / vision

One Featurebase org powering, eventually, **all** of these surfaces:

| Surface | Where | Purpose | Identity |
|---|---|---|---|
| Feedback widget (bugs + ideas) | **everywhere** — storefront (`web`) + roaster + org + admin portals | capture as much signal as possible during beta | identified (Clerk) in portals; anonymous on storefront |
| Feature requests board | public board | let users propose + vote | identified where possible |
| Changelog | portal headers (+ storefront footer?) | "what's new" | n/a |
| **Help center** | storefront + portals | self-serve docs / FAQ | n/a |

> Decision on file (2026-06-05): target **everywhere** for maximum info collection during beta.
> Storefront/buyer feedback is anonymous and expected to be noisier — accepted trade-off.

## Current state (what's already built)

- `@repo/feedback` package (`packages/feedback/`): `keys.ts`, env-gated `<FeedbackWidget>`
  (`widget.tsx`), `buildFeedbackIdentity()` (`identify.ts`).
- Env vars added to the Vercel sync allowlist for `roaster`/`org`/`admin` (extend to `web` when
  the storefront widget is mounted).
- **Not yet mounted** in any app. Widget self-gates (inert until `NEXT_PUBLIC_FEATUREBASE_ORG`
  is set and it's rendered in a layout).

## Open questions to resolve when we fully spec

- Help center: use Featurebase's hosted help center, or our own docs surface + Featurebase only for feedback?
- Storefront widget: floating launcher vs. a "Report a problem" link in checkout/footer? Noise controls?
- Identity verification (SSO): confirm Featurebase's exact scheme + whether we need it for storefront.
- Changelog placement + whether buyers see it.
- Moderation / triage workflow: who owns the boards, SLAs for responses.
- Data/privacy: what user data we pass (esp. for buyers); DPA with Featurebase (add to runbook §A.1 vendor list).
- Free tier limits vs. paid features we'll actually need (private boards, SSO, help center).

## Related

- [`./setup.md`](./setup.md) — implementation checklist (this folder)
- [`../runbooks/sandbox-to-production-cutover.md`](../runbooks/sandbox-to-production-cutover.md) §14 — env-var rows
- [`../runbooks/v1-launch-runbook.md`](../runbooks/v1-launch-runbook.md) — go-live reminder lives there
- [`../runbooks/observability-setup.md`](../runbooks/observability-setup.md) — the sibling integration this mirrors
