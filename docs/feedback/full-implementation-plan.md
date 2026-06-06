# Feedback & Help Center — Full Implementation Plan (STUB)

**Status**: 🚧 **STUB — to be specced later.** Do not treat as final. This is a placeholder so
we can come back and write the real plan as part of the go-live strategy.
**Last updated**: 2026-06-05

> Revisit trigger: after the credential cutover is done and the beta is live with its first
> orders, before broad rollout. Pair with [`./README.md`](./README.md) open questions.

## To be filled in

### 1. Product scope
- [ ] Final surface list (storefront / roaster / org / admin) + exact placements per surface
- [ ] Help center: hosted Featurebase vs. own docs; content inventory
- [ ] Feature-request board structure, voting, public vs. private
- [ ] Changelog cadence + who publishes

### 2. Technical design
- [ ] SDK call signatures confirmed vs. Featurebase docs
- [ ] Identity verification (SSO) scheme + `FEATUREBASE_SSO_SECRET` signing — confirm HMAC vs JWT
- [ ] Storefront anonymous capture: noise controls, rate limiting, spam handling
- [ ] Server-side post creation via `FEATUREBASE_API_KEY` (if needed) + which events trigger it
- [ ] `<FeedbackWidget>` API: changelog launcher, help-center launcher, theming per app

### 3. Data & privacy
- [ ] What user data is passed per surface (esp. buyers)
- [ ] DPA with Featurebase signed; add to runbook §A.1 vendor DPA list
- [ ] PII review — align with the same scrubbing posture as Sentry/PostHog

### 4. Ops / triage
- [ ] Board ownership, triage workflow, response SLAs
- [ ] Routing: bugs → issues/Sentry correlation; feature requests → roadmap
- [ ] Free-tier limits hit → paid upgrade triggers

### 5. Rollout
- [ ] Sequence relative to go-live (fast-follow vs. day-1)
- [ ] Per-surface enablement order
- [ ] Success metrics (submissions, response time, deflection via help center)

## Decisions already made (carry forward)
- 2026-06-05: target **everywhere** for max info collection; storefront anonymous accepted.
- 2026-06-05: integration mirrors the BetterStack pattern (`@repo/feedback`, env-gated widget).
