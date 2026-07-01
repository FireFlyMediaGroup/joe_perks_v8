# Neon production snapshot (Block A step 1)

**When:** Before any significant production write — migrations, smoke-lane seed, pilot bootstrap, or schema changes.

**Record the snapshot ID** in [`../v1-go-live-guide.md`](../v1-go-live-guide.md) master log step **1** (Notes column) and in your rollback card (step **4**).

---

## Recommended: Neon Console (fastest)

1. Open [Neon Console](https://console.neon.tech) → your **Joe Perks production** project.
2. Select the **`main`** branch (production Neon host: `ep-bold-field-…` — see `packages/db/.env.production.example`).
3. Go to **Backup & restore** (enable **Enhanced view** if the page only shows point-in-time restore).
4. Click **Create snapshot**.
5. Name it something traceable, e.g. `pre-pilot-bootstrap-2026-06-30`.
6. Optional: set **expires at** (runbook recommends ≥ 7 days retention discipline; paid plans allow more manual snapshots).
7. After creation, copy the **snapshot ID** into the go-live guide master log.

   The Console list shows the **name** (e.g. `pre-pilot-bootstrap-2026-06-30`) but often **not** the ID. To get the ID:

   - **DevTools:** Backup & restore → Network → refresh → open the `snapshots` API response → find `"id"` (format e.g. `snap-tiny-paper-a40a9das`), or
   - **API:** [`List project snapshots`](https://api-docs.neon.tech/reference/listsnapshots) with project id + API key (see below).

   For **Console-only restore**, the name is enough; the ID is for the runbook audit trail and API rollback.

**Restore later:** same page → select snapshot → **Restore** → choose one-step or multi-step per [Neon backup docs](https://neon.com/docs/guides/backup-restore).

---

## Alternative: Neon API + CLI (scripts / CI)

`neonctl` has **no** `snapshots create` subcommand. Use the CLI to discover IDs, then call the API.

```bash
# One-time auth + link (from repo root)
npx neonctl@latest auth
npx neonctl@latest link

# Branch id for main
npx neonctl branches list --output json
```

```bash
export NEON_API_KEY="..."       # Neon Console → Account → API keys
export NEON_PROJECT_ID="..."    # same as GitHub secret in .github/workflows/e2e.yml
export BRANCH_ID="..."          # main branch id

curl -sS -X POST \
  "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${BRANCH_ID}/snapshot" \
  -H "Authorization: Bearer ${NEON_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name": "pre-pilot-bootstrap-2026-06-30"}' | jq .
```

List snapshots:

```bash
curl -sS \
  "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/snapshots" \
  -H "Authorization: Bearer ${NEON_API_KEY}" | jq .
```

---

## Notes

- Snapshots must be taken from a **root branch** (`main` qualifies).
- **Free plan:** 1 manual snapshot at a time; create a new one only after deleting or expiring the old one if needed.
- Creating a **branch** (`neonctl branches create`) is a different backup pattern — use **snapshots** for the launch runbook rollback path.
- Do not confuse with `pnpm db:seed:prod` — that seeds singleton rows; it is **not** a Neon snapshot.

## Related

- [`prod-smoke-lane.md`](./prod-smoke-lane.md) — prerequisite #1
- [`v1-go-live-guide.md`](../v1-go-live-guide.md) — Block A step 1
- [`v1-launch-runbook.md`](./v1-launch-runbook.md) — §B.2 cutover + rollback procedure
