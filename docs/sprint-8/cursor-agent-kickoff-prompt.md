# Sprint 8 — Cursor Agent Kickoff Prompt

Use this prompt to start a fresh Cursor session on the next Sprint 8 story. This version is tuned to kick off implementation immediately and should be paired with [`docs/sprint-8/cursor-agent-prompt.md`](./cursor-agent-prompt.md).

```text
You are starting Sprint 8 roaster fulfillment implementation in the Joe Perks repo.

This is a strict story-by-story execution workflow.

Before doing anything else:
1. Read `docs/sprint-8/cursor-agent-prompt.md`
2. Read `docs/sprint-8/README.md`
3. Read `docs/SPRINT_8_CHECKLIST.md`
4. Read `docs/SPRINT_8_PROGRESS.md`
5. Read `docs/sprint-8/roaster-fulfillment-epic-v4.md`
6. Read `docs/sprint-8/roaster-fulfillment-preflight-decisions.md`
7. Read the next unfinished Sprint 8 story from `docs/sprint-8/stories/`
8. Read all directly relevant code files for that story

Your operating rules:
- Work on exactly one story in this session
- Do not start the next story in this session
- Do not guess
- If anything is unclear, contradictory, or missing, stop and ask the user
- Testing is mandatory during the story
- If tests/checks fail because of your changes, fix them before proceeding
- Documentation updates are mandatory before proceeding at every step and stage
- Do not leave docs stale while continuing implementation

Story completion gate:
Do not consider the story complete until all of the following are true:
1. the story implementation is complete
2. the relevant tests/checks have been run
3. any introduced issues are fixed
4. the story doc has been updated
5. `docs/SPRINT_8_CHECKLIST.md` has been updated
6. `docs/SPRINT_8_PROGRESS.md` has been updated
7. `docs/sprint-8/README.md` has been updated if sprint-level context changed
8. any affected shared docs/diagrams have been updated

Sprint 8 decisions you must enforce:
- Keep one live fulfillment link per order
- Reuse the active token for normal reminder tiers while it is still valid
- Rotate the token row only on expiry or explicit regeneration
- Expired-link recovery is token-based, not order-ID-based
- Unresolved flags pause reminder/urgent/buyer-delay/auto-refund automation
- Portal mutations use server actions with `requireRoasterId()`
- Tracking correction is portal-only and writes `TRACKING_UPDATED`
- `fulfillmentNote` is in scope
- Payout UI must use live `HELD / TRANSFERRED / FAILED` vocabulary
- EasyPost, packing slips, batch fulfillment, carrier-webhook delivery replacement, and magic-link portal login are out of Sprint 8 unless explicitly reprioritized by the user

Quality requirements you must enforce:
- Mobile-first implementation
- 44x44px minimum touch targets
- Keyboard accessibility
- Visible focus states
- Proper screen-reader-friendly validation and alerts
- Focus management after async actions
- Reduced-motion support
- No unexplained spinner-only states
- Never expose buyer PII in logs
- Token and portal fulfillment experiences should remain operationally consistent

Execution task for this session:
- Determine the next unfinished Sprint 8 story in dependency order
- Summarize:
  - the selected story
  - why it is the next one
  - the files likely to change
  - the acceptance criteria
  - the tests/checks you expect to run
  - the docs that must be updated before the story can be closed
- Then implement only that story
- Then test, fix issues, update docs, summarize completion, and stop

If this is the very first Sprint 8 implementation session, start with:
- `docs/sprint-8/stories/US-10-00-fulfillment-schema-event-alignment.md`

Do not begin coding until you have read the required Sprint 8 docs and confirmed the target story scope against the live codebase.
```

## Usage note

Recommended workflow:

1. Open a fresh Cursor session.
2. Paste this kickoff prompt.
3. Let the agent select and execute exactly one Sprint 8 story.
4. End the session when the story is complete.
5. Start a new session for the next story.
