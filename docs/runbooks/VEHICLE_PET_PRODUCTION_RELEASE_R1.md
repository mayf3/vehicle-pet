# Controlled Runbook R1 — Vehicle Pet fixed-ref production release

```text
RUNBOOK_ID = VEHICLE_PET_PRODUCTION_RELEASE_R1
STATUS = active
ASSURANCE = CONTROLLED
BINDING_TOOL = scripts/release/vehicle-pet-release.mjs (v1.0.1)
SCOPE = mayf3/vehicle-pet → the current DeepSeek Harness web profile, and nothing else
AUTHORITY = Owner Goal dispatch GOAL_NAME=发布 (OWNER_DISPATCH_UNIT=GOAL);
            this runbook is an Assurance artifact and creates no Product Authority
```

## 1. Identity and boundaries

This runbook covers exactly one operation class: moving the DSH web
profile's `@mayf3/vehicle-pet` dependency from its current exact git ref to
a new exact git ref, then restoring a verified-running web service.

Hard boundaries:

- The tool accepts ONLY an exact 40-hex commit SHA. `main`, branches,
  tags, `latest`, and short SHAs are rejected before anything runs.
- Repository `main` and the production runtime ref are independent facts.
  "origin/main moved" is NEVER a reason to deploy. Deployments happen only
  when the Owner names a `TARGET_REF`.
- The tool never resets, stashes, checks out, or pulls the Owner's working
  checkout. Git truth is proven by fetching the exact SHA from the origin
  URL into a throwaway EMPTY bare repository (a local-object shortcut in
  the working repository can never fake this proof), and repository bytes
  come from `git archive <ref>`.
- Only the web profile service is ever restarted, only via its freshly
  discovered process tree, only with its own recorded argv/cwd/env.
- This runbook does not authorize: removing the plugin, re-seeding state,
  deploying other plugins, restarting unrelated DSH agents or
  deepseek-pet, or deploying anything that is not `mayf3/vehicle-pet`.

## 2. Actors and authorization

```text
OPERATOR = mayf3, or an Agent holding an attributable Owner mandate for one
           specific TARGET_REF
APPROVAL = the Owner names TARGET_REF (40-hex) explicitly per deployment
```

A Goal dispatch, issue, or direct instruction naming the exact SHA is the
approval. An Agent must never select the target itself ("latest" is not a
target).

## 3. Environment facts (fresh every run — never cached)

Every run re-derives: DSH home, profile, current production ref, installed
package, lockfile resolution, plugin membership, service identity/PID/port,
web health, served client bytes, and pet browser state. Do not substitute
memory PIDs, previous receipts, or stale worktrees.

Defaults (override with flags when needed):

| Fact | Default discovery |
|---|---|
| DSH home | `$DSH_HOME` else `~/.dsh` (`--dsh-home`) |
| Profile | `web` (`--profile`) |
| Web service | live TCP listeners + `dsh web` command match + env home match |
| Web port | the listener's port; `--port` disambiguates |
| State probe | Owner browser CDP at `http://127.0.0.1:9222` (`--cdp-url`) |
| Git truth repo | the repository containing the tool (`--vehicle-pet-repo`) |

## 4. Secret handling

Receipts contain: profile package.json + pnpm-lock bytes (exact), plugin
membership, other-plugin resolutions, service command/cwd/allowlisted-env
(the allowlist is a projection — only `DSH_*`,
`SSH_CONNECTION`, and `NODE_ENV` are recorded), port/health, served client hashes, and
pet-owned browser storage keys — the EXACT bytes of the overlay-preferences
and usage-ledger keys (including per-session lastSeen identifiers) plus
`deepseek-pet:scale` and an IndexedDB aggregate summary. Receipts never
contain prompts, completions, message bodies, tool payloads, credentials,
browser profiles, or DSH-home copies.

## 5. Step A — preflight / plan (READ_ONLY, always first)

```bash
node scripts/release/vehicle-pet-release.mjs <TARGET_40HEX>
```

Expected output: `RESULT PLAN_READY` (or `NO_OP_ALREADY_AT_TARGET` when
current == target). The receipt directory is printed; the run writes only
inside the receipt root (including its housekeeping `.gitignore`) and the
git object store (fetch-by-SHA into an empty verification repository, per
§1). Do not continue if any of these are wrong:

- `GIT_TRUTH` — target must resolve from origin (empty-bare fetch probe; a
  locally-created commit that origin does not have is REJECTED).
- `CURRENT_REF_DISCOVERY` — the profile pin must be a git-fixed-ref.
- `SERVICE_DISCOVERY` / `WEB_HEALTH` — exactly one healthy dsh web service.
- `STATE_PROBE_PRE` — a browser tab matching the web origin (the
  discovered port) must exist (open the daily tab if not).

The `--profile` flag exists for disposable environments only; the
production scope of this runbook is the current `web` profile.

## 6. Step B — apply (the only production-mutating mode)

```bash
node scripts/release/vehicle-pet-release.mjs <TARGET_40HEX> --apply
```

Gates, in order (each is recorded as a receipt step; every stop writes a
receipt and exits nonzero):

1. `CONCURRENCY_GATE` — no other process may hold the profile
   package.json/lockfile; bytes re-checked at pin time. Stop:
   `STOPPED_AT_CONCURRENT_WRITER`.
2. `PRE_INSTALL_CONSISTENCY` — every non-vehicle-pet dep must already agree
   between package.json and the lock, so install cannot re-resolve it.
   Stop: `UNRELATED_DEPENDENCY_DRIFT (PRE_INSTALL)`.
3. `PIN` — surgical byte rewrite of the vehicle-pet spec only
   (`<same url>#<target>`), verified as a single-dependency semantic delta.
4. `INSTALL` — `pnpm install` in the profile directory.
5. `LOCK_DRIFT_GATE` — post-install lock compared to the preimage lock;
   anything besides the vehicle-pet move stops and AUTO-REVERTS
   (preimage bytes restored + reinstall + lock byte-check).
   Stop: `UNRELATED_DEPENDENCY_DRIFT (POST_INSTALL, reverted)`.
6. `MEMBERSHIP_GATE` — `dsh.profile.bundles` must be byte-equal. Stop:
   `MEMBERSHIP_DRIFT`.
6b. `LOCK_REF_GATE` — the post-install lockfile must resolve the exact
   TARGET ref (the drift gate allows the move; this proves it moved TO the
   target). Stop + auto-revert: `VEHICLE_PET_LOCK_ANOMALY`.
7. `RESTART` — SIGTERM to the recorded tree only, relaunch of the recorded
   argv/cwd/env detached, `WEB_PORT_AFTER == WEB_PORT_BEFORE`, health 200.
   Stop: `RESTART_*`.
8. `RUNTIME_PROOF` — three layers must agree on the TARGET ref:
   lock resolution, installed tree vs `git archive <target>` (files-field
   projection, per-file sha256), and served client bytes == installed
   bytes. Failure: `RUNTIME_PROOF_FAILED` (apply is FAILED, never
   reported as success).
9. `STATE_POSTFLIGHT` — position/reduced-motion/size preferences
   byte-equal, usage ledger and progress non-regressing, engine IndexedDB
   summary preserved, `deepseek-pet:scale` unchanged. A missing probe fails
   the apply loudly unless `--allow-missing-state-probe` is given
   (discouraged; documented deviation required in the receipt note).

Exit codes: `0` success/no-op · `2` rejected before mutation · `3` stopped
by a gate · `4` failed after mutation (rollback available) · `70` internal
error (receipt may remain `IN_PROGRESS` — read it; a crash after the pin
step leaves current == target, which rollback accepts).

## 7. Step C — rollback (fixed to the preimage)

```bash
node scripts/release/vehicle-pet-release.mjs rollback --receipt <apply receipt dir>
```

Rollback installs the receipt's exact preimage package.json bytes (ref =
`PREIMAGE_PRODUCTION_REF`), re-runs the lock-drift, lock-ref and membership
gates, restarts the web service, and re-proves runtime identity against the
preimage ref. It only runs from the exact applied state recorded in the
receipt; it is not a general "go to any ref" command. It never removes the
plugin.

Abort conditions that require rollback: restart failure, runtime proof
failure, or the Owner asking to return. Between a failed step and the
rollback, change nothing else.

Special case — restart failed and NOTHING listens on the web port: the
rollback itself needs a healthy service, so first bring one up manually
from the receipt's `preimage/service.json` (recorded argv/cwd/env; on the
prod service shape `pnpm dsh web …` from the harness checkout), let health
return 200, then run the rollback above. Do not improvise beyond the
recorded command.

Residual known limit: if the web service were ever supervised with
auto-restart (launchd KeepAlive et al.), the supervisor would race the
tool's relaunch after TERM. The current production shape is an unsupervised
detached process tree; if that changes, stop and reconcile the runbook
first.

Attempt bounds: one apply per receipt; do not retry a failed apply without
reading its receipt and, if the profile was reverted, starting from Step A
again.

## 8. Step D — evidence persistence

Evidence is committed from fresh remote truth, never from a possibly stale
local main (the be653ba incident):

```bash
node scripts/release/vehicle-pet-release.mjs evidence \
  --src <receipt-dir> --dest docs/evidence/release/<id> \
  --message "docs(release): <id> receipts (preimage/apply/postflight)"
```

This fetches origin, cuts `evidence/release-<timestamp>` from the exact
current `origin/main` in a fresh worktree, copies only allowed file types
under `docs/evidence/`, verifies the commit touches nothing outside
`docs/evidence/**`, and leaves pushing/opening the docs-only PR to the
Operator. The local checkout is never touched.

Housekeeping: the evidence worktree is created NEXT TO the repository as
`<repo>-evidence-wt-<timestamp>` and is intentionally kept for inspection
after the commit. Archive the receipt into `docs/evidence/` (Step D) soon
after every apply — the receipt root is gitignored and is the only copy of
the exact preimage bytes. When done: `git worktree remove <path> && git
branch -D evidence/release-<timestamp>`.

If repository main moves after an apply, that is fine: the production ref
does not chase main, and no re-deploy is performed to "catch up".

## 9. Receipts

Each run writes `<out>/vehicle-pet-release-receipts/<UTC stamp>-<mode>-<target8>-<rand>/`
(default root inside the tool repository; never inside `~/.dsh`):
`receipt.json` (facts, steps, verdicts, result), `preimage/`
(package.json, pnpm-lock.yaml, profile-facts.json, service.json,
state.json, served-client.json), `service-restart.log`, and after an
apply `postimage/state.json`. Keep receipts for review; curate the minimal
set into `docs/evidence/` via Step D.

## 10. Verification matrix (what must have been proven before a release is called done)

| Proof | Where |
|---|---|
| Default invocation is zero-mutation | `pnpm test:release` + plan receipt |
| Exact-40-hex only | `pnpm test:release` (refs.test) |
| NO_OP at same ref, ZERO_MUTATION=YES | plan/apply receipt on current ref |
| Unrelated lock drift rejected before restart | pre-install gate + lockfile tests + E2E CASE_3 |
| Controlled restart, port stable, health PASS | apply receipt `RESTART` steps |
| Served runtime (not just package ref) | apply receipt `RUNTIME_PROOF` (3 layers) |
| State preservation | apply receipt postflight verdicts |
| Rollback to preimage | rollback receipt (E2E CASE_4) |
| Stale local main safety | flow-evidence tests (fixture repos) |
| Evidence from remote main | evidence command + flow-evidence tests |

## 11. Validity

This runbook binds while the tool at the pinned version matches the
behavior above. Any change to the tool's mutation semantics requires a new
runbook revision before the next apply.
