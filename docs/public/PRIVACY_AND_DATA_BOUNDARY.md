# Privacy and Data Boundary

Status: Public Preview documentation, current as of the DSH_PET_OVERLAY_ADAPTER_V8 authority.

## What the overlay reads

| Input | Source | Use |
|---|---|---|
| Live session state (idle / running / needs-input) | Harness structured session events | transient visual presentation only |
| Terminal turn status (completed / failed / cancelled) + a deterministic identity (`sessionId#turn#seq`) | Harness structured turn-end events | one edge-deduplicated visual reaction per turn; a HostActivityEvent dispatch back to the host |
| Counts-only token usage | the host's counts-only usage seam | growth points (the single progress economy) |
| Active session **titles** (`title` / `displayTitle`) | Harness structured session-list metadata | sanitized, length-bounded label in the resident footer only — local display; never fed into speech selection, never persisted, never uploaded |
| Browser-local preferences (pet, size, position, reduced motion, ritual day markers) | the browser's own localStorage under a namespaced key | remembering your settings |

## What it never reads

Prompt bodies, completion bodies, user message content, reasoning text,
credentials, clipboard, other plugins' DOM, network resources, or the host
profile/filesystem. There is no telemetry, analytics, or external network
path of any kind (enforced by a bundle gate: no `fetch`/XHR/WebSocket/
EventSource in the shipped client).

## What it writes

- Browser-local storage only: the versioned preferences record and the pet's
  own growth data (journal, receipts, keepsakes) via the engine's storage
  adapter.
- Nothing else. Uninstall removes the overlay DOM, styles, listeners, and
  subscriptions; stored browser-local growth data is the user's record and
  survives uninstall by design (rollback/reinstall keeps progress).

## Conversion boundary

Session activity is never converted into growth points. A turn produces at
most one temporary visual reaction and one short spoken line — never points,
never a level change. Growth comes exclusively from the counts-only usage
seam through the same engine contracts as the standalone prototype.

## Sanitized-evidence convention (repository hygiene)

New evidence and production records in this repository should use sanitized
forms (`$HOME`, `<DSH_HOME>`, `<HOSTNAME>`, `<TAILSCALE_HOST>`) instead of
real personal paths or hostnames, unless the exact value is irreplaceable for
acceptance. Historical evidence predating this convention may contain real
values; that exposure is recorded honestly, and history rewrites remain an
Owner decision — none has been made.

## Classification rules used by release hygiene

Findings classify as `SECURITY_SECRET` (ship blocker: stop, contain, report
to Owner), `PERSONAL_ENV_METADATA` (redact going forward; record exposure),
`PUBLIC_REPRODUCIBILITY_DATA` (fine), `HISTORICAL_EVIDENCE` (kept, clearly
separated from current identity), or `FALSE_POSITIVE`.
