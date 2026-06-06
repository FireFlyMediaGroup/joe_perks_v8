# Cursor IDE Prompt — Commit & push the v1 launch-readiness docs

Paste everything below this line into Cursor's agent/composer. It assumes the repo is already open at `FireFlyMediaGroup/joe_perks_v8` and that `git` + `gh` CLI are on `$PATH`.

---

## Role

You are a senior engineer with shell + git + `gh` CLI access inside Cursor. Your job is to **verify**, **amend if needed**, and **commit & push** four new launch-readiness docs plus three small edits to index files for the Joe Perks v1 launch. Do not change any application code. Do not run the test suite. Do not delete files.

## Context you need

- **Repo:** `github.com/FireFlyMediaGroup/joe_perks_v8`
- **Product:** Joe Perks — three-sided B2B2C marketplace (specialty-coffee roasters + orgs/schools/sports/nonprofits + buyers) with a three-way Stripe split.
- **Stack:** Turborepo + pnpm@10.31.0 (canonical) / Bun (secondary); Next.js 16; TypeScript strict; Prisma 7 on Neon Postgres; Clerk; Stripe Connect with split transfers; Resend + React Email; Inngest; Upstash; Sentry; PostHog; BetterStack; UploadThing; Basehub CMS.
- **Apps / ports:** `web` 3000, `roaster` 3001, `org` 3002, `admin` 3003, `email` 3004, `studio` 3005.
- **Commits:** Conventional Commits, scope required, e.g. `docs(pre-mortem): …`, `docs(testing): …`.
- **Safety rules (non-negotiable):**
  - Do **not** push to `main` or `develop` directly.
  - Do **not** force-push.
  - Do **not** modify global `git config`.
  - Do **not** use `--no-verify`.
  - Do **not** stage `scripts/vercel-sync-envs.mjs` — it's an unrelated in-flight change.
  - If a pre-commit hook fails, fix the issue and create a **new** commit (never `--amend`).

## What should already exist in the working tree

Four new files (untracked until you stage them):

| Path | Purpose | Approx size |
|---|---|---|
| `docs/pre-mortems/2026-04-19-v1-launch.md` | Dated immutable pre-mortem: 16 Tigers (7 launch-blocking LB-1…LB-7, 6 fast-follow FF-1…FF-6, 3 track T-1…T-3), 5 Paper Tigers PT-1…PT-5, 5 Elephants E-1…E-5. Cross-links to the three docs below + `SCAFFOLD_CHECKLIST.md` Phase 10. | ~13 KB |
| `docs/testing/money-path-e2e-scenarios.md` | Addresses LB-7: 3 happy-path scenarios (MP-01 min split, MP-02 multi-item mid, MP-03 max boundary) + 24 edge cases (EC-01…EC-24) + 10 invariants + CI guidance. | ~18 KB |
| `docs/runbooks/v1-launch-runbook.md` | Phase A (T-14…T-3 prepare: A.1 legal, A.2 auth, A.3 money path, A.4 observability, A.5 data/deploy, A.6 DNS/env, A.7 webhooks, A.8 abort), Phase B (T-2…T-0 rehearsal + go-live), Phase C (T+1…T+30 watch), rollback tree, go/no-go template. | ~13 KB |
| `docs/gtm/pilot-outreach.md` | Addresses Elephant E-1: cold emails, 30-min discovery scripts (Mom-Test style), roaster + org pilot agreements, tracker, debrief template, stop-at-20-calls rule. | ~16 KB |

And three files should be **modified**:

- `AGENTS.md` (root) — pointer section added referencing the new docs.
- `docs/AGENTS.md` — document index entries for the four new docs; notes Phase 10 is the action-item source of truth.
- `SCAFFOLD_CHECKLIST.md` — Phase 9 amended to reference runbook + pre-mortem; **new Phase 10** ("Pre-mortem mitigation gate") with tables for LB-1…LB-7 (launch-blocking), FF-1…FF-6 (fast-follow, weeks W1–W3), T-1…T-3 (track), and E-1…E-5 (elephants). Footer date updated to "April 2026".

Plus one unrelated modified file to **exclude**: `scripts/vercel-sync-envs.mjs` (adds `"SESSION_SECRET"` to `ALLOWED_KEYS`). Leave it alone.

## Step 0 — Verify state

Run these and confirm before doing anything else:

```bash
git status
git log --oneline -5
git rev-parse --abbrev-ref HEAD   # expect: chore/vercel-rollout-and-org-updates
git diff --stat AGENTS.md docs/AGENTS.md SCAFFOLD_CHECKLIST.md
ls -la docs/pre-mortems docs/testing docs/runbooks docs/gtm
wc -l docs/pre-mortems/2026-04-19-v1-launch.md docs/testing/money-path-e2e-scenarios.md docs/runbooks/v1-launch-runbook.md docs/gtm/pilot-outreach.md
```

**If any of the four new doc files is missing**, stop and tell me before proceeding — do not invent content. **If they are all present**, continue.

## Step 1 — Branch off `develop`

```bash
git fetch origin
git checkout develop
git pull --ff-only origin develop
git checkout -b docs/v1-pre-mortem-launch-readiness
```

> The new docs + modifications were authored on `chore/vercel-rollout-and-org-updates` but live in the working tree, not the index. After `git checkout develop` the untracked files (the four new docs) stay in place; the modifications to the three index files also stay if they're not committed. Verify with `git status` after the branch switch. If Git complains that the checkout would overwrite tracked changes, `git stash -u -m "carry docs for branch move"`, switch branches, then `git stash pop`.

## Step 2 — Stage selectively (exclude the unrelated change)

```bash
# New docs
git add docs/pre-mortems/2026-04-19-v1-launch.md
git add docs/testing/money-path-e2e-scenarios.md
git add docs/runbooks/v1-launch-runbook.md
git add docs/gtm/pilot-outreach.md

# Index updates (only these three — NOT scripts/vercel-sync-envs.mjs)
git add AGENTS.md docs/AGENTS.md SCAFFOLD_CHECKLIST.md

# Verify the vercel-sync-envs.mjs change is NOT staged
git diff --cached --name-only
git status
```

Expected staged list (7 files):

```
AGENTS.md
SCAFFOLD_CHECKLIST.md
docs/AGENTS.md
docs/gtm/pilot-outreach.md
docs/pre-mortems/2026-04-19-v1-launch.md
docs/runbooks/v1-launch-runbook.md
docs/testing/money-path-e2e-scenarios.md
```

If `scripts/vercel-sync-envs.mjs` appears anywhere in the staged list, unstage it: `git restore --staged scripts/vercel-sync-envs.mjs`.

## Step 3 — Commit in four logical chunks

Git identity is not set locally. Use per-command `-c` flags — do **not** write to `~/.gitconfig`:

```bash
AUTHOR=(-c user.name="FireFlyMediaGroup" -c user.email="wearefireflymedia@gmail.com")
```

(If the user is running this themselves, replace with their own identity as appropriate. Ask before changing defaults.)

### Commit 1 of 4 — pre-mortem

```bash
git reset   # unstage everything so we can split
git add docs/pre-mortems/2026-04-19-v1-launch.md
git "${AUTHOR[@]}" commit -m "docs(pre-mortem): add 2026-04-19 v1 launch pre-mortem

Capture 16 tigers (7 launch-blocking, 6 fast-follow, 3 track), 5 paper
tigers, and 5 elephants across technical, product, GTM, and operational
lenses. Dated immutable snapshot; mitigations tracked in
SCAFFOLD_CHECKLIST.md Phase 10."
```

### Commit 2 of 4 — money-path E2E scenarios

```bash
git add docs/testing/money-path-e2e-scenarios.md
git "${AUTHOR[@]}" commit -m "docs(testing): add money-path E2E scenarios and invariants

Covers LB-7: 3 happy-path scenarios (min/mid/max split boundaries) +
24 edge cases including webhook idempotency, tenant isolation, refund
and dispute flows, SLA breach, and Connect-disabled mid-order. Lists
10 split-math invariants and CI integration guidance."
```

### Commit 3 of 4 — launch runbook

```bash
git add docs/runbooks/v1-launch-runbook.md
git "${AUTHOR[@]}" commit -m "docs(runbooks): add v1 launch runbook

Three phases — A prepare (T-14..T-3), B go-live (T-2..T-0),
C watch (T+1..T+30) — plus rollback decision tree, abort criteria,
and go/no-go meeting template with sign-off lines."
```

### Commit 4 of 4 — GTM outreach + index updates

```bash
git add docs/gtm/pilot-outreach.md AGENTS.md docs/AGENTS.md SCAFFOLD_CHECKLIST.md
git "${AUTHOR[@]}" commit -m "docs(gtm): add pilot outreach kit and wire launch docs into indexes

Addresses Elephant E-1 with cold emails, 30-min discovery scripts
(Mom-Test style), roaster and org pilot agreements, outreach tracker,
and call-debrief template. Adds cross-references from AGENTS.md
(root + docs) and a new SCAFFOLD_CHECKLIST.md Phase 10 as the single
source of truth for pre-mortem mitigations."
```

## Step 4 — Push and open a PR (don't merge)

```bash
git log --oneline -6
git push -u origin docs/v1-pre-mortem-launch-readiness

gh pr create \
  --base develop \
  --head docs/v1-pre-mortem-launch-readiness \
  --title "docs: v1 pre-mortem + launch runbook + money-path E2E + GTM outreach" \
  --body "$(cat <<'EOF'
## Summary
- Dated pre-mortem snapshot (`docs/pre-mortems/2026-04-19-v1-launch.md`) — 16 tigers, 5 paper tigers, 5 elephants across technical, product, GTM, and ops lenses.
- Money-path E2E scenarios + 10 split-math invariants (`docs/testing/money-path-e2e-scenarios.md`) covering LB-7.
- Standalone v1 launch runbook (`docs/runbooks/v1-launch-runbook.md`) with phased execution, rollback tree, and go/no-go template.
- Pilot outreach kit (`docs/gtm/pilot-outreach.md`) to unblock Elephant E-1.
- `SCAFFOLD_CHECKLIST.md` Phase 10 added as the single source of truth for mitigation action items; `AGENTS.md` + `docs/AGENTS.md` updated to surface the new docs.

## Out of scope
- No application-code changes. `scripts/vercel-sync-envs.mjs` is intentionally not included in this PR.

## Review checklist
- [ ] Links between pre-mortem, runbook, E2E scenarios, outreach, and Phase 10 resolve both ways.
- [ ] Phase 10 tables reconcile with tiger IDs in the pre-mortem.
- [ ] Commit messages follow Conventional Commits with correct scopes.
- [ ] Nothing outside the 7 staged files is included.
EOF
)"
```

Print the PR URL at the end.

## Step 5 — Summary back to me

Reply with:
1. Branch name.
2. The four commit SHAs + subjects (one line each).
3. The PR URL.
4. Whether `scripts/vercel-sync-envs.mjs` is clean-untouched (confirm with `git diff scripts/vercel-sync-envs.mjs | head`).

---

## Decisions — defaults with override notes

These are already baked into the steps above; change them inline if you need different behavior.

1. **Git identity:** per-command `-c user.name=FireFlyMediaGroup -c user.email=wearefireflymedia@gmail.com`. *Override:* edit the `AUTHOR=(…)` line.
2. **`scripts/vercel-sync-envs.mjs`:** excluded. *Override:* if you want it in, run it as its own `chore(scripts):` commit on a different branch — do not fold it into this docs PR.
3. **Branch:** new `docs/v1-pre-mortem-launch-readiness` off `develop`. *Override:* rename in Steps 1 and 4.
4. **Commit granularity:** four commits, one per doc area. *Override:* squash into one before pushing with `git reset --soft $(git merge-base HEAD develop) && git commit -m "docs: v1 pre-mortem + launch readiness bundle"`.

## If regeneration is ever needed

The four new docs should already be on disk. If for any reason they're missing, **stop and ask me first** — don't regenerate blind. The canonical structure is captured in this file's "What should already exist in the working tree" table and in the pre-mortem's cross-reference section; ID lists (LB-1…LB-7, FF-1…FF-6, T-1…T-3, PT-1…PT-5, E-1…E-5, MP-01…MP-03, EC-01…EC-24) must match between the pre-mortem, Phase 10, and the E2E scenarios doc.

---

*End of prompt.*
