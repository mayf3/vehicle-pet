# Pet Definition Reference (Creator Kit V1)

The single source of truth for the TS types is
`src/dsh/client/pets/types.ts`; the working example is
`examples/minimal-pet/pet/pet.json`. This page explains each field and
its constraints. Validation (`pnpm pet:validate`) enforces the machine-
checkable parts and names the exact offending field.

## pet.json (PetPresentation V1)

| Field | Type | Notes |
|---|---|---|
| `id` | string | lowercase `[a-z][a-z0-9-]*`, unique, stable, matches the directory name; preference key |
| `displayName` | `{ 'zh-CN', en }` | menu label, fallback text, aria labels |
| `recipe` | `'engine-scene' \| 'pose-sprite'` | fixed generic vocabulary; the DSH surface currently ships these two |
| `packId` | string | the journey Pack this pet presents (must be a bundled pack) |
| `userSelectable` | boolean | false = bundled but not offered in the menu |
| `gradePolicy` | object | `showExactLevelNumber`, `showDescription`, `insigniaMode: 'none' \| 'wearable'` (`'overlay'` exists in the vocabulary but is rejected until a renderer implements it) |
| `gradeLevels` | `levels.json` | per-level localized descriptions, `id` matching the journey's `levelId`s |
| `behavior` | object | `ambientPool` (ids from `ambient-rules.ts` vocabulary), `stateReactions`, `petting` |
| `speech` | `speech.json` | category → bilingual lines; categories fixed (`idle`…`ritual`) |
| `license` | object | `license`, `attribution`, `provenance` (a file inside `pet/`) |

Unknown fields are rejected by schema — extra data has nowhere to hide.

## Recipe data

`pose-sprite` requires a `poseSprite` block:

- `variantPose`: all ten expression variants (`idle`, `idle-happy`,
  `idle-curious`, `idle-sleepy`, `working`, `needs-input`, `completed`,
  `completed-proud`, `failed`, `cancelled`) → pose index; several variants
  may share one pose. Out-of-range indices are rejected.
- `poseSource: { kind: 'files', dir: './assets' }`: transparent PNG+WebP
  pairs named `pose-0.png/.webp`, `pose-1.png/.webp`, … (320×540 canvas).
  Creator pets are files-only — `kind: 'module'` is a repository-internal
  generated-asset seam (bundled reference pets only) and is rejected by
  validation for creator pets.
  The generator measures per-pose visible-alpha bounds `[x0, y0, x1, y1]`
  automatically — the resident hitbox hugs them (V3 CTR-OVERLAY-003 hit
  honesty) and no hand-measured numbers exist to drift.
- `insignia` (optional): `{ assetSource: { kind: 'files', dir: './assets' } }`
  with `l1.svg … l<N>.svg` files. Required only when `gradePolicy.insigniaMode`
  is `'wearable'` (V8 CTR-040).

`engine-scene` requires `expressionAnchors`: per-level face-anchor rects
(`[left, top, size]` in % of the level sprite canvas) used by the generic
expression overlay; the visuals themselves come from the journey pack's
scenes via the generic scene renderer.

## Journey manifest (Pet Pack)

Schema: `src/engine/schema/pet-pack-manifest-v1.schema.json` (ajv-validated;
unknown fields are rejected). Highlights:

- `packId`, `packVersion`, localized `name`;
- `displayConversion` (unit label + points-per-unit for the journey dialog);
- `levels[]`: `levelId`, `threshold` (ascending), localized
  `stageName`/`summary`/`milestone`, `sceneId`, optional `keepsakeId`
  (every non-initial level must reference a keepsake), `presentation`
  presets (`scale: individual|group|cluster|field|region|horizon`,
  `camera: close|district|city|metro|regional|continental|terminal`,
  `milestone: inline|…`);
- `scenes[]`: `backgroundAssetId` (role `background`), `layers` (subject
  placement), localized `sceneLabel`, `transition`;
- `assets[]`: `assetId`, `path` (must exist), `format`, `role`, dimensions,
  `byteSizeCompressed`, localized `altText`;
- `keepsakes[]`: `keepsakeId`, `levelId`, localized title/description,
  `assetId`.

## Speech catalog

Categories: `idle`, `working`, `needs-input`, `completed`, `failed`,
`milestone`, `petting`, `welcome`, `ritual`. New pets: ≥1 line per locale for
each of the six core categories (V8 reconciliation item 6). The bundled
reference pets keep the larger floors (30 lines/locale, 5 per core category,
3 per ritual category). One scheduler, one content boundary — no status
codes, percentages, or token counts in lines.

## Grade presentation policy (V8 DEC-029/CTR-040)

- `showExactLevelNumber: false` keeps `L<n>` numerals off the resident
  surface; the exact grade stays in `data-vehicle-pet-grade` and the aria
  description regardless.
- `showDescription: true` shows your `gradeLevels` localized text.
- `insigniaMode: 'none'` imposes nothing; `'wearable'` composes your
  insignia over every pose × level combination without detaching.
- Policy data must never invent level meanings; the Engine owns derivation.

## Preference, migration, fail-soft (V8 CTR-041)

Stored pet ids resolve against the registry; unknown/removed ids fail soft to
the documented default (`vehicle`) without touching growth data. Old
two-value preference records keep working unchanged.
