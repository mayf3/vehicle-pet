# GOAL_LIFELIKE_PREFLIGHT — Goal「生命感」EXPERIENCE_PREFLIGHT record

```text
GOAL_NAME = 生命感
GOAL_MODE = NEW_GOAL
CURRENT_PHASE = EXPERIENCE_PREFLIGHT (complete at this record's commit)
PREFLIGHT_MODE = spec-governance PREFLIGHT (this record is an Investigation; it is not Product Authority)
```

## 0. Coordinates

```text
FRESH_READ_BASE = mayf3/vehicle-pet origin/main 116824b (Merge PR#34, codex/overlay-v6-implementation)
LOCAL_MAIN_AT_DISPATCH = b64e2d0 (stale; origin/main had advanced)
GOAL_WORKTREE = /Users/yanfenma/workspace/project/vehicle-pet-lifelike-20260910 (branch lifelike/preflight-20260910, fresh from 116824b)
OBSERVED_AT = 2026-09-10
METHOD = git fetch + log/branch merge-base checks; full reads of governing Specs; read-only source census of src/dsh/client/**
```

## 1. Dependency gate determination

Dispatch precondition: Goal「角色」needs `AUTHORITY_STATE = ACCEPTED` and
`IMPLEMENTATION = MERGED` before this Goal may fresh-read latest main,
recompute the authority route, and enter implementation.

Observations (all at 2026-09-10, `git -C <repo>`):

| Check | Result |
|---|---|
| `codex/character-overlay-v4` (角色 authority, DSH_PET_OVERLAY_ADAPTER_V4, PR#29) | MERGED into origin/main (ancestor) |
| `codex/character-integration-v4` (角色 implementation, PR#30) | MERGED into origin/main (ancestor) |
| Spec index at 116824b | `DSH_PET_OVERLAY_ADAPTER_V4` listed `superseded` (by V5, then V6); `DSH_PET_OVERLAY_ADAPTER_V6` listed accepted/active — which requires V4 to have been accepted and merged first |
| `codex/character-visual-v1` (unmerged) | docs/preview-only branch (art previews, `docs: preview …`), not part of the 角色 implementation contract; non-blocking |
| Open PRs | only #35 `[DO NOT MERGE] cordis pin`, unrelated |

```text
DEPENDENCY_GATE = OPEN
GOAL_STATUS = NEW_GOAL (active; NOT BLOCKED_BY_DEPENDENCY)
RESUME = n/a — proceeding through phases in order from preflight
```

Post-gate landscape found by the fresh read (not known at dispatch time):
after 角色 merged, two further overlay rounds completed on main:
Overlay V5 (PR#31/32: double-click settings, recurring speech, transparent
pet) and Overlay V6 (PR#33/34: compact captions, eight bounded playful
reactions). Current overlay authority is therefore **DSH_PET_OVERLAY_ADAPTER_V6**,
current engine authority **CONFIGURABLE_PET_ENGINE_V4**.

## 2. Authority inventory at 116824b (active set)

```text
PRODUCT_DIRECTION = VEHICLE_PET_PRODUCT_DIRECTION_V1 (accepted)
ENGINE = CONFIGURABLE_PET_ENGINE_V4 (accepted, implementation_authority: contracts)
OVERLAY = DSH_PET_OVERLAY_ADAPTER_V6 (accepted, implementation_authority: contracts, 28 contracts, supersedes V5)
PROGRESS = VEHICLE_PET_PROGRESS_SOURCE_V2 (accepted candidate lineage)
USAGE = DSH_USAGE_PROGRESS_SOURCE_V2 (accepted)
GOVERNANCE = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2 (accepted)
```

## 3. Read-only UX census (implementation at 116824b)

Method: read-only file reads; no modification of any product surface.

What the resident already does (file → behavior):

- `VehiclePetOverlay.tsx` — persisted machine VISIBLE/COLLAPSED only; pet hit
  button carries pointer/keyboard; click → `playful.play()` (rotating pool) +
  interaction count + throttled click line; `event.detail>1` ignored;
  double-click → secondary menu (with drag/suppressed-click guards);
  Shift+Enter/ContextMenu keyboard equivalent; Escape closes menu/dialog.
- `useOverlayDrag.ts` — pointer capture drag; `DRAG_THRESHOLD_PX = 4`; a real
  drag sets `ignoreClickRef` so the trailing click is consumed; visible moves
  persist normalized ratios; keyboard steps 8/32 px; menu-aware complete
  surface layout; composer/whale-safe defaults.
- `playful-reactions.tsx` — 8 composite reactions (wave, wink, bounce, peek,
  shy, sleepy, proud, nod): variant + pointer-inert SVG decoration + one-shot
  CSS motion ≤1200 ms, reaction window ≤2400 ms; new input replaces, never
  queues; cancelled by state change / menu / drag / hidden / unmount; OS
  `prefers-reduced-motion` observed live (static pose + decoration remain);
  session state changes and ambient lines also drive reactions (CTR-028).
- `VehiclePetSpeech.tsx` + `speech-rules.ts` — one bubble; pure cadence rules:
  load quiet 15 s, recurring deadline randomized 20–40 s (persistent across
  switches; hidden/input attempts consume the deadline), typing suppression
  5 s (payload-ignored keydown/pointerdown recency), click throttle 30 s,
  auto-dismiss 4 s (3–6 s), no immediate repeat within category, rotation
  counter + injected random; milestone path (6 s proud window); per-character
  catalogs.
- `speech-catalog.ts` + `character-speech.json` — categories idle/working/
  needs-input/completed/failed/milestone, ≥30 lines per locale per character.
- `expressions.ts` — 10 static variants; five-state mapping duty; pure
  variant selection over (state, terminal, milestone, clickCount, idleBucket,
  lastVariant) with no immediate repeat; idle buckets 2/10 min.
- `preferences.ts` — versioned tolerant browser-local record (position,
  collapsed, inert reducedMotion, size, characterId) + same-origin storage
  event adoption; normalizer reconstructs fields explicitly (unknown fields
  are dropped today).
- Engine `DailyGreeting` (via `PetEngineProvider`) — one greeting per
  device-local day, first-open-of-day, presented through `.vp-greeting`.
  This is an existing FIRST_OPEN_TODAY-family ritual at the Engine/react
  layer (out of overlay scope, reusable as-is).
- `styles.ts` — engine-level `reducedMotion` is hard-wired true (permanently
  static baseline, V5 DEC-015); the blanket `animation:none` is pierced only
  by the V6 gesture selectors, and OS reduced-motion kills those too.

## 4. Goal-to-current-state gap analysis (mechanical)

Goal V1 five interactions vs current authority/implementation:

| Goal item | State at 116824b | Verdict |
|---|---|---|
| INTERACTION_1 DIRECT_TOUCH single click | CTR-021/028 implemented (rotating playful pool + throttled line) | REUSE; click-variety/no-immediate-repeat already contractual |
| DOUBLE_CLICK = short playful reaction | **Conflict**: active authority allocates double-click to settings (V5 DEC-OVERLAY-008, Owner five-point feedback; kept by V6). CTR-028 allows *at most one* playful reaction per double-click sequence | Authority wins (active accepted Spec outranks the dispatch's semantic *suggestion*; same Owner, later decision). V7 keeps double-click = settings + one permitted short reaction. Goal's DOUBLE_CLICK acceptance is satisfied under that reading |
| LONG_PRESS / PETTING | Absent. No hold-detection exists; drag threshold only | NEW → gesture arbitration + petting surface (authority change) |
| INTERACTION_2 CURSOR_AWARENESS | Absent. CTR-015 permits **only** the bounded one-shot gestures of CTR-028 | NEW → conflicts with CTR-015 permission list (authority change) |
| INTERACTION_5→4 AMBIENT_BEHAVIOR (own repertoire + minutes-level cadence) | Partial: ambient *lines* at 20–40 s advance the 8-reaction pool. No repertoire beyond the pool, no minutes-level gap, CTR-028 forbids an extra ambient timer | NEW semantics → conflicts with CTR-028 "no extra ambient timer" (authority change) |
| INTERACTION_3 DRAG_BODY_REACTION | Absent. CTR-021: "dragging MUST cause neither reaction nor menu" | NEW semantics → conflicts with CTR-021 literal reading (authority change) |
| DAYPART behavior | Absent (selection has no local-time input) | NEW (authority change: selection inputs) |
| RETURN RITUAL / welcome-back | Absent (no lastSeenAt persistence) | NEW (authority change: preference evolution + trigger sources) |
| SMALL DAILY RITUALS | FIRST_OPEN_TODAY exists (Engine DailyGreeting). first-completion-today, late-night absent | Partial REUSE + NEW bounded additions |
| CHARACTER_PERSONALITY | Two declarative characters, per-character catalogs, shared scheduler. No behavior-weight profiles | NEW declarative weights (authority change: CTR-022 extension) |
| NO_NEEDINESS / TOYS / LONG-Term MEMORY | Not present anywhere | Maintain prohibitions (anti-churn carries forward) |

Affected accepted meanings: CTR-015 (motion permission scope), CTR-018/019
(trigger sources, selection inputs), CTR-021 (drag/click semantics + new
gesture), CTR-010 (preference record evolution), CTR-022 (declarative
character data scope), CTR-028 (ambient action source + timer prohibition +
bounds). Under the governance grammar these are *expanded/replaced meanings*,
not additive-only:

```text
AUTHORITY_ACTION = SUPERSEDE
SUCCESSOR = DSH_PET_OVERLAY_ADAPTER_V7 (whole-authority, docs-first, atomic backlinks)
SUPERSEDED = DSH_PET_OVERLAY_ADAPTER_V6
ENGINE = REUSE (CONFIGURABLE_PET_ENGINE_V4 untouched)
PROGRESS/TOKEN_ECONOMY = REUSE (unchanged seams)
CHARACTER_ASSETS = REUSE (no new art generation; declarative behavior data only)
PLAN_LEVEL = EXEC_PLAN (authority phase → implementation phase → audits → merge; multi-round)
ASSURANCE_LEVEL = DURABLE (implementation); production apply stays OUT OF SCOPE
ROUTE_STAGE during preflight = AUTHORITY_AUTHORING (no implementation before V7 acceptance merges into the implementation base)
```

## 5. Interaction model design (inputs to V7)

### 5.1 Gesture state model (deterministic arbitration)

One adapter-owned gesture machine per resident pointer session. States and
transitions (all timings constants recorded in the Spec and unit-tested):

```text
IDLE --pointerdown(primary)--> PRESSED{t0, origin}
PRESSED --move>DRAG_THRESHOLD(4px)--> DRAGGED        (existing drag controller takes over; petting/click cancelled)
PRESSED --held>=PETTING_HOLD_MS--> PETTING           (hold timer; no movement beyond a small jitter tolerance)
PRESSED --pointerup<t0+CLICK_MAX_MS, no move--> CLICK
PETTING --pointermove beyond jitter--> DRAGGED       (long press cannot become a drag mid-hold unless user moves: cancel petting, do NOT start position drag from a petting hold? => NO: movement during PETTING cancels petting and starts drag only if button still held; simplest deterministic rule: any move>4px from origin at any time => DRAGGED)
PETTING --held, periodic--> petting progress ticks (bounded, e.g. 700ms per tick, max duration cap)
PETTING --pointerup--> PETTING_RELEASE (settle + affectionate close)
CLICK --second pointerdown within DOUBLE_CLICK_MS--> DOUBLE_CLICK (settings path; consumes the first click's bubble/reaction per CTR-021/028)
DRAGGED --pointerup--> DROP (settle reaction; trailing synthetic click consumed by existing ignoreClickRef)
```

- CLICK_MAX_MS and PETTING_HOLD_MS: Agent freezes by real-feel testing in the
  isolated DSH, within the Goal's 400–800 ms band for the hold; CLICK_MAX_MS
  chosen so a normal click never reaches PETTING and a petting never fires a
  click (click suppressed once hold fires).
- DOUBLE_CLICK keeps V6 semantics (settings) — the double-click sequence
  produces at most one reaction and never two bubbles (CTR-021 carried).
- DROP must not trigger accidental click (existing suppressed-click consume
  stays; V7 adds the settle reaction, which is not a click reaction).
- Keyboard parity: Enter/Space = single click reaction; Shift+Enter /
  ContextMenu = settings (unchanged); no long-press keyboard requirement
  (petting is pointer-only; accessible description documents it).

### 5.2 Petting (long-press) presentation

- During hold: affectionate static-family variant (idle-happy / closed-eye
  family via existing masters — no new art), bounded one-shot "melting"
  motion (≤4 px / ≤4°, same bounds class as CTR-028), optional single very
  short line per petting episode, throttled (petting shares the click-line
  throttle family with its own budget).
- Release: return to baseline; no score, no toast, no counter surfaced,
  no growth mutation (Engine snapshots byte-identical — reuse ACC-108 method).
- Suppresses ambient behavior and recurring speech attempts during the hold
  (recent-interaction cooldown applies after release).

### 5.3 Cursor awareness

- Input: pointermove over the overlay root's own hit surface neighborhood
  only (adapter-owned coordinates; no host DOM reads). Proximity radius
  constant recorded in the Spec.
- Implementation: rAF-bounded (≤1 update per frame, and skipped entirely
  when no pointer activity), writes CSS custom properties (`--vp-gaze-x/y`,
  clamped to a small bound ≤4 px translation of the expression/pose layer
  toward the cursor; head-region anchor from the existing face-anchor table).
  No per-pixel React state; no re-render on pointermove (CSS var only).
- Deactivation: pointer leaves proximity or stops for a bounded idle window
  → variables ease back to 0; dragging, menu open, petting hold, hidden
  document, and working/needs-input states disable tracking (baseline only).
- `prefers-reduced-motion` (and the permanently-static engine baseline):
  tracking STATIC_OR_DISABLED — no transform at all; state readability
  unchanged (expression variant still renders).
- The visible figure and its pointer target transform together (hit-honesty
  carried from CTR-028); labels/footer/bubble stay still.

### 5.4 Drag body reaction

- DRAG_START (threshold passed): surprised/curious variant held while
  dragging (existing masters; no new art), plus bounded tilt toward movement
  direction (clamped ≤4°, CSS transform on the figure, hitbox moves with it).
- DROP: ≤1200 ms settle reaction (squash-class ≤4 px) then baseline.
- Position persistence semantics unchanged: ratios, clamp, menu-projected
  complete surface, keyboard movement all reuse the existing controller;
  the reaction layer is purely presentational.
- Drag must not fire click/double-click/petting (existing suppression kept;
  arbitration model above is normative in V7).

## 6. Ambient behavior model (inputs to V7)

### 6.1 Behavior profile (declarative, per character)

```text
AMBIENT_ACTION_POOL (vehicle): LOOK_LEFT, LOOK_RIGHT, SENSOR_CHECK, WHEEL_BLINK (light accent), SMALL_SHUFFLE
AMBIENT_ACTION_POOL (companion): STRETCH, YAWN, GLANCE_AT_TERMINAL, REST, TIDY_CUFF, LOOK_AROUND
```

Each pool entry = existing variant/pose master (or a mirror/offset recipe of
it — no new art) + optional pointer-inert decoration + one-shot motion within
the recorded bounds (same class as CTR-028: ≤4 px / ≤4°; duration cap
recorded, stretch/yawn may use the longer bound). `CHECK_DEVICE`/
`LOOK_AT_SCREEN`/`SMALL_PLAYFUL_MOVE` are satisfiable by LOOK/GLANCE entries;
no runtime image generation, no Live2D, no new animation framework.

### 6.2 Ambient scheduler (separate, slow, quiet)

```text
MIN_AMBIENT_GAP = minutes-level: randomized 90–240 s (Agent freezes exact band after real-feel runs; floor ≥90 s)
LOAD_QUIET_PERIOD = no ambient action within the first 120 s of mount (and the existing 15 s speech quiet still applies)
USER_TYPING_SUPPRESSION = payload-ignored input recency < 10 s suppresses an ambient action (attempt consumed, no catch-up)
WORKING_STATE = SPECIALIZED: while running/needs-input, ambient actions are suppressed except state-appropriate ones (working variant micro-action); terminal reactions always preempt
RECENT_INTERACTION_COOLDOWN = no ambient action within 120 s of the last direct interaction (click/petting/drag/settings)
NO_BACK_TO_BACK_SAME_ACTION = per-character recent-history exclusion (same rule shape as speech no-repeat)
```

- One adapter-owned timer (V7 explicitly permits the second, slow timer —
  this supersedes CTR-028's "no extra ambient timer" clause for this
  bounded purpose); consumed-deadline semantics (no catch-up bursts after
  typing/hidden, mirroring CTR-019's mechanism).
- Ambient actions are pointer-inert, never steal focus, never block the
  composer/send/whale, cancel on state change/menu/drag/hidden (reuse the
  playful-reaction lifecycle machinery).
- ANNOYANCE target: majority-silent presence.

### 6.3 Daypart model (device-local only)

```text
LOCAL_TIME_BUCKETS: MORNING 05–11, DAYTIME 11–17, EVENING 17–23, LATE_NIGHT 23–05 (device-local hour; no calendar/location/message access)
EFFECT = weights only: ambient action selection weights (e.g. sleepy/rest ↑ late night), idle expression tendency (idle-sleepy bucket bias ↑ late night), speech probability (ambient line attempt suppression ↑ late night), never a schedule, never a "go to sleep" lecture
ALLOWED COPY = at most rare gentle lines ("今天也辛苦啦。" family) inside the new daypart/ritual category; no moralizing
```

Pure function: `(localHour, characterProfile) → weightTable`; unit-tested.

### 6.4 Return ritual and small daily rituals

- `lastSeenAt` persisted browser-local (preference-record evolution, tolerant
  optional field; schema stays compatible — absent field = no welcome).
- On mount: `now - lastSeenAt ≥ WELCOME_BACK_THRESHOLD` (Agent freezes; band
  ≥ 8 h) → one welcome-back line through the existing scheduler's explicit
  (milestone-style) path after the load-quiet period. Lines: "回来啦。" /
  "又见面啦。" / "今天也一起吧。" family. **Forbidden**: absence duration,
  streaks, guilt, loneliness phrasing. `ABSENCE_PENALTY = NONE`.
- Precedence when both apply on a return day: welcome-back (absence) takes
  the greeting slot; Engine DailyGreeting stays authoritative for
  first-open-today otherwise (no double greeting).
- `FIRST_COMPLETION_TODAY`: first terminal `completed` edge of a local day →
  one short line, once per local day (persisted day-key, tolerant optional
  field). `LATE_NIGHT`: at most once per local day, only if the user is
  active in the LATE_NIGHT bucket, gentle line, no lecture. Ritual lines are
  per-day bounded; no system notifications ever.
- Ritual ledger fields live in the same tolerant browser-local record (or a
  sibling versioned key under the same tolerance contract — final choice
  recorded in V7); nothing durable outside the browser, no new database.

## 7. Character personality (inputs to V7)

Declarative per-character behavior profile added to the existing bundled
character definitions (no user-facing personality setting, no third
character):

```text
VEHICLE = energetic, task-oriented: ambient weights favor LOOK/SENSOR/WHEEL/SHUFFLE; completed → proud/lights family ("跑完啦。" tone); petting → happy wiggle family
HUMANOID = calmer, warmer: ambient weights favor STRETCH/REST/YAWN/TIDY; completed → nod/quiet smile ("搞定。" tone); petting → shy/heart family
```

Same underlying events, different presentation weights and catalog emphasis.
Selection remains pure functions over (profile, state, daypart, history,
injected random).

## 8. Speech engine integration

- Reuse the ONE scheduler (CTR-019 mechanics unchanged for existing
  sources). New trigger sources are additive: PETTING, WELCOME_BACK,
  DAYPART_RITUAL, DAILY_RITUAL, AMBIENT_ACTION (optional short line on a
  small subset of ambient actions).
- Catalog: new categories with SMALL pools — petting, welcome, ritual —
  per character per locale (floor ≥3 per new category; no 38→300 explosion;
  total budget bounded, exact floors recorded in V7).
- All existing gates stay: single bubble, auto-dismiss, typing suppression,
  no-repeat, click throttle (petting throttle sibling), load quiet.

## 9. Acceptance design (Goal E1–E15 → V7 acceptance items)

| Goal evidence | V7 acceptance mapping (method family) |
|---|---|
| E1 single click | existing CTR-021/ACC-121 matrix re-run + reaction pool rotation |
| E2 double click | settings opens; ≤1 reaction; never two bubbles (ACC-104/121) |
| E3 long press / petting | NEW ACC: hold-band verification (no click fired, no drag fired), affectionate presentation, release settle, no score/toast, Engine snapshot byte-equal |
| E4 drag start/drag/drop | NEW ACC: surprised variant at start, bounded tilt while dragging, settle on drop, position persistence byte-equal, no accidental click |
| E5 cursor awareness | NEW ACC: proximity follow within bounds, restore on leave, static under reduced motion, no per-pixel React state (rAF/CSS-var proof), hitbox moves with figure |
| E6 ambient idle action | NEW ACC: repertoire renders per character, bounds respected, cancel matrix (state/menu/drag/hidden) |
| E7 daypart variation | NEW ACC: injected local hours → weight tables; late-night sleepy bias; no lecture lines |
| E8 welcome back | NEW ACC: threshold crossing → welcome line once; no absence duration/guilt; absent field → no line |
| E9 typing suppression | existing + extended (ambient actions suppressed; consumed deadlines) |
| E10 reduced motion | existing parity extended to all new surfaces (static variants remain) |
| E11/E12 SMALL/LARGE | all new surfaces verified at both sizes + viewport bounds |
| E13/E14 vehicle/humanoid personality | NEW ACC: same event → different weights/lines per character (pure-function matrices + rendered contact) |
| E15 whale coexistence / composer safe | existing coexistence matrix re-run (default placements, bubble/label/footer clearance) |

Plus: `pnpm verify`, `pnpm verify:dsh` (isolated pinned DSH per the fixed
conventions), `assets:check`, `git diff --check`; goal-mandated test names
(PET_SINGLE_CLICK … COMPOSER_NO_OCCLUSION) land as unit/DOM/E2E cases in the
implementation round.

## 10. Test design (implementation round)

Unit (pure, fake clock/injected random): gesture arbitration matrix
(CLICK_DOES_NOT_DRAG, DRAG_DOES_NOT_CLICK, LONG_PRESS_DOES_NOT_DOUBLE_CLICK,
DOUBLE_CLICK_DOES_NOT_FIRE_TWO_BUBBLES, DROP_DOES_NOT_TRIGGER_ACCIDENTAL_CLICK);
petting tick/release; ambient cadence (gap band, load quiet, typing
suppression, interaction cooldown, no back-to-back, consumed deadlines);
daypart weight tables; welcome-back threshold + no-guilt copy guard;
ritual once-per-day semantics; personality profile selection; catalog floors.
DOM/E2E (isolated pinned DSH): the Goal's named cases; reduced-motion parity;
SMALL/LARGE; whale coexistence; composer no-occlusion; disposal inventory
extended with the ambient timer and cursor listeners.

## 11. Production boundary and stop controls

```text
PRODUCTION_APPLY_ALLOWED = NO (unchanged; Goal stops at READY_FOR_PRODUCTION_APPLY)
EXPANSION_TRIGGER = any proposal beyond §5–§8 surfaces (toys, feeding, memory, third character, pet-communication, Live2D, TTS, audio, DSH Core changes) → FOLLOW_UP_DEBT only
DONE_WHEN = per Goal §26 (all PASS / audits ACCEPT / SHIP_BLOCKERS 0 / MERGED / isolated DSH acceptance / ANNOYANCE_RISK LOW)
```

## 12. PREFLIGHT route record

```text
AUTHORITY_ACTION = SUPERSEDE (DSH_PET_OVERLAY_ADAPTER_V6 -> V7), docs-first
READINESS = authority NOT_YET (V7 not authored/accepted at this record)
NEXT_ACTION = AUTHOR V7 proposal on this branch (docs-only), then independent review, Owner acceptance, merge; implementation only from the merged base
OPEN_OWNER_DECISIONS = NONE (dispatch + active authority resolve all; double-click conflict resolved by authority precedence, §4)
NORMATIVE_TBD = constants to freeze by real-feel test in implementation round: PETTING_HOLD_MS band 400–800, AMBIENT gap band ≥90 s, WELCOME_BACK_THRESHOLD ≥8 h — bands declared in V7, exact values recorded in the implementation conformance record
```
