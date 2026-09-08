# Vehicle Pet release tool (Goal 发布)

Repository-local fixed-ref production release helper for the DSH web
profile. It encodes the Owner-proven upgrade path so an Agent never has to
re-derive it per round.

```text
node scripts/release/vehicle-pet-release.mjs <TARGET_40HEX>            # read-only plan
node scripts/release/vehicle-pet-release.mjs <TARGET_40HEX> --apply    # production mutation
node scripts/release/vehicle-pet-release.mjs rollback --receipt <dir>  # back to preimage ref
node scripts/release/vehicle-pet-release.mjs evidence --src <p> --dest docs/evidence/<id> --message <m>
```

- Exact 40-hex SHA only; `main`/branch/tag/short SHA are rejected.
- Default mode is read-only (writes only under the receipt root).
- Facts are re-derived fresh every run (home, profile pin, lockfile,
  membership, service PID/port, health, served bytes, browser state).
- Unrelated dependency drift stops the apply before the restart.
- Runtime proof = lock ref + installed-vs-`git archive` content + served
  bytes hash, all at the target ref.
- Rollback is fixed to the receipt's preimage ref.
- The authoritative procedure is
  `docs/runbooks/VEHICLE_PET_PRODUCTION_RELEASE_R1.md`.

Layout:

```text
vehicle-pet-release.mjs   CLI entry
lib/util.mjs              process/hash/io helpers
lib/refs.mjs              exact-ref validation + git truth + archive extraction
lib/lockfile.mjs          pnpm-lock extraction + drift classification
lib/dshfacts.mjs          home/profile/package/lock/membership facts
lib/service.mjs           service discovery + controlled restart
lib/stateprobe.mjs        read-only CDP pet-state probe + preservation verdicts
lib/proof.mjs             runtime identity proof
lib/preimage.mjs          receipt directory + preimage capture
lib/flow.mjs              plan / apply / rollback orchestration
lib/evidence.mjs          docs-only evidence branch from fresh origin/main
e2e/run-disposable-e2e.mjs  disposable end-to-end proof (pnpm verify:release)
```

Tests: `pnpm test:release` (hermetic unit + fixture-git integration).
Full disposable E2E: `pnpm verify:release`.
