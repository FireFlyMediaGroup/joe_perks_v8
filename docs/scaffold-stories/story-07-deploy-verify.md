# Story 07 — Deployment and Verification

**Story version:** 0.1  
**Status:** `Todo`  
**Owner:** Tech lead / full-stack / ops  
**Depends on:** `story-00-manual-foundation.md`, `story-03-checkout-webhooks.md`, `story-04-email-pipeline.md`, `story-05-inngest-jobs.md`, `story-06-auth-admin.md`

---

## Goal

Move the project from “scaffolded locally” to “deployed, wired, and verified” using the environments and checks already defined in the baseline scaffold documents.

---

## Checklist alignment

- `docs/SCAFFOLD_CHECKLIST.md` — Phases 6, 7, 8, and 9
- `docs/SCAFFOLD_PROGRESS.md` — Vercel, verification, branching workflow, and production-readiness rows

---

## In scope

- Create and configure the four Vercel projects
- Add environment variables for Preview and Production
- Configure domains and external endpoints
- Run the first smoke-test pass
- Add any missing verification helpers needed by the checklist, such as `/api/test-sentry`
- Confirm the expected branching / CI workflow is usable by the team

---

## Out of scope

- New product features unrelated to launch readiness
- Major architectural changes that belong in earlier stories

---

## Deliverables

1. Vercel projects for `web`, `roaster`, `org`, and `admin`
2. Preview + Production env vars configured
3. Connected Stripe / Clerk / Inngest endpoints
4. Initial smoke-test results recorded
5. Progress tracker updated to reflect deployment readiness

---

## Acceptance criteria

- All app projects build in Vercel
- Preview deployments are usable for review
- Custom domains are configured when DNS is ready
- `/api/test-sentry` (or equivalent) exists if the checklist depends on it
- Stripe webhook verification works in deployed environments
- Inngest sync works against the deployed route
- `develop` / feature branch flow is documented and active for the team

---

## Suggested implementation steps

1. Create the Vercel projects and add env vars.
2. Add any missing verification routes/helpers.
3. Register Stripe, Clerk, and Inngest endpoints.
4. Run the Phase 7 smoke tests.
5. Update docs and close the story only after evidence is recorded.

---

## Revision log

| Version | Date | Notes |
|---|---|---|
| `0.1` | 2026-03-22 | Initial story created. |
