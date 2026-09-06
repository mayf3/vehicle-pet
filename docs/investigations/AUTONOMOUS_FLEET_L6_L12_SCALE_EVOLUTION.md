# Investigation — autonomous-fleet L6–L12 scale-evolution art adoption

```text
SPEC_GOVERNANCE_MODE = PREFLIGHT
PREFLIGHT_MODE = SUPERSEDE
CHANGE_CLASS = NON_MECHANICAL
MECHANICAL_EXEMPTION_REVIEW = NOT_APPLICABLE
GOVERNANCE_ADOPTION_STATUS = accepted
PRIMARY_GOVERNING_SPEC = CONFIGURABLE_PET_ENGINE_V2
RELATED_ACCEPTED_AUTHORITIES = VEHICLE_PET_PRODUCT_DIRECTION_V1, VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1, DSH_PET_OVERLAY_ADAPTER_V1, DSH_USAGE_PROGRESS_SOURCE_V1, VEHICLE_PET_PROGRESS_SOURCE_V2
GOVERNING_SPEC_REVISION = aa0a014dfc7767f1ff25c73c4775fdd687d56734 (docs/specs/CONFIGURABLE_PET_ENGINE_V2.md)
BASE_COMMIT = aa0a014dfc7767f1ff25c73c4775fdd687d56734
SPEC_PRESENT_IN_BASE = YES
SPEC_STATUS_IN_BASE = accepted
IMPLEMENTATION_AUTHORITY = contracts
REQUEST_WITHIN_CONTRACT_SCOPE = NO (CTR-PET-010 freezes the §11.1 L6–L12 narrative the new art contradicts)
AUTHORITY_CONFLICT = the Owner-approved L6–L12 art replaces the frozen V2 escort/roof-part visual identity; §11.1 narrative rows and DEC-PET-031 normative text must change → whole-authority SUPERSEDE (V0 forbids partial supersession)
IMPLEMENTATION_ALLOWED = NO_UNTIL_V3_ACCEPTED_IN_BASE
NEXT_ACTION = author CONFIGURABLE_PET_ENGINE_V3 (docs-only, full copy of V2 + DEC-PET-032 + revised §11.1 L6–L12 rows), independent review, accept, merge, then implement on a base containing accepted V3
```

## Observations

### OBS-EVO-001 — Owner preview serves the finalized L6–L12 art from a local evidence directory

- Subject: `http://127.0.0.1:3088/` preview server
- Observed at: `2026-09-06T20:50:00+08:00` (process start 2026-09-06 19:36 local)
- Method: `lsof -nP -iTCP:3088 -sTCP:LISTEN` → PID 17894, `python3 -m http.server 3088 --directory <dir>`
- Result: preview root is
  `/Users/yanfenma/workspace/project/vehicle-pet-wt-light-companion-spec-20260906/docs/evidence/pony-v1-scale-v2-20260906`
  (an old agent worktree; used read-only as input source, not as a development tree)
- Provenance: this record

### OBS-EVO-002 — The preview directory contains the complete art pipeline and final masters

- Subject: the directory of OBS-EVO-001
- Observed at: `2026-09-06T20:50:00+08:00`
- Method: read `README.md`, `build.py`, `quality.json`, `prompts.json`; list files
- Result: `raw-l6..l12.png` are the image-generation originals; `build.py` deterministically
  derives the final `l6..l12.png` (1024×1024 RGBA transparent, supervision-count label
  "1 人监管 N 辆" typeset locally, remote-operator figure, per-level scale outline),
  lossless `l6..l12.webp`, and `sprites480/` (480×480) versions; L1–L5 PNGs are byte-copies
  of the previous approved round (`unchanged_from_previous: true` in `quality.json`)
- Provenance: this record; hashes below

### OBS-EVO-003 — Frozen input hashes (SHA256, measured 2026-09-06T20:52+08:00)

`ART_SOURCE_COORDINATES` =
`/Users/yanfenma/workspace/project/vehicle-pet-wt-light-companion-spec-20260906/docs/evidence/pony-v1-scale-v2-20260906`

`ART_SOURCE_HASHES` (final masters → the official integration input):

```text
l6.png  3304df2c5a971406d63cdb9931204d47d699600441928b85811fe2c62baf0d6f
l7.png  094f893d7da8e1c933679dde0547de28823e28436fcd22e07558442d3d150c48
l8.png  75a0b4ce1285e2ef657a47b70a3f66927688eecd3bba08832e90ac78f5f6db1e
l9.png  45bd6f5d28ffb38bdebf18fb3586955bbb2c36c71bfd5799d2da9eb1c256c2d5
l10.png 4e326d8b178b22a3e1f17a1568051fa3445f998070e413c85ff91df9f0f421c8
l11.png 7689b40aa08687c363cabfd14ce0159ac821f381950834ab42af986ee0736f38
l12.png 0ce66bef9501df0a5b131e0aa76adb0f532b5e6cfb53d814fd3d7003fc750d20
```

Generation inputs and preview evidence (for traceability; the raw files stay in the
source directory, which is not deleted):

```text
raw-l6.png  abf237d92b652d5a79695d1199fa31a129ed96e687bbadc2a2c36c57fa2a587e
raw-l7.png  f11b33b3c576ed53998e68cf5912a0e07204d7e442cf89c8ef059c158f156b88
raw-l8.png  5d07830ea1494f71fedea74822286f77de773e48b48759954ed5fcf2da380c77
raw-l9.png  f84f990db722363d512df3c1a6f933fa1067c7e49a4407b1b3a705e2f38e4639
raw-l10.png e0db9307d4f719d453a658f10c66184da73776135d7e0186b95ff5d34ffa8558
raw-l11.png fa4fce1e4dfb9f29cf2eace72592a4ec9a2ca89cdebe885b0b360ba0759fbade
raw-l12.png 0ed4f9ef3b3be6d30901cf2d01757e01ce9321722d798fffd5d6a78f5d8f3904
build.py    cf1a352c98782f24db7ea36cef5d4c8d7b47924e2e8653582dcffb04a583294f
quality.json 540dab459047ab2eb75d4aa8619415d07a7cbc537ee648b9863a00692fd365a4
prompts.json 67b8d8a3a5bc9dde50c8aa7884cf0f732c06432b821f50162c564205e23ead0e
overview.png (12-level contact sheet) da9fa6d1cdbe493c006fee8ae5af0f70c7ba71d6a7a18b521ad611179fee2427
l6-l12-overview.png (L6–L12 contact sheet) 2cc0c9c00bb23ac18e1a38cb9ff309906d12f969284863b0be33ba8c8746cd94
```

Internal consistency: every `quality.json` `sha256` matches the independently measured
hash of the corresponding final PNG (OBS-EVO-003 method, byte-for-byte re-hash).

### OBS-EVO-004 — Contact sheet shows the frozen scale narrative

- Subject: `l6-l12-overview.png` (hash above)
- Method: direct image reading
- Result: L6 three-car squad → L7 ten-car array → L8 dense 100-car fleet → L9 lead car
  before one city skyline → L10 multiple city skylines → L11 multi-region landmark pins →
  L12 lead car before a blue globe; every cell carries the supervision label
  ("1 人监管 3/10/100/1,000/1 万/10 万/100 万辆"), the remote-operator figure, and a
  transparent background. Matches the Owner's frozen level semantics L6=3 … L12=1,000,000.

### OBS-EVO-005 — Accepted V2 freezes the L6–L12 narrative the new art contradicts

- Subject: `docs/specs/CONFIGURABLE_PET_ENGINE_V2.md` at `aa0a014dfc…`
- Method: read §11.1, CTR-PET-010, DEC-PET-031
- Result: §11.1 "Frozen zh-CN narrative" rows L6–L12 describe the V2 single-car identity
  ("车身加宽，双侧灯带点亮" / "更大的传感环上车顶" / "车侧发光显示窗" / "加长车身与车顶传感塔" /
  "双层传感环转动" / "发光灯带、传感环与天线全开" / "旗舰传感冠…两辆迷你保护车随行");
  CTR-PET-010 requires the Pack to implement the frozen narrative; DEC-PET-031 requires
  every level's sprite to carry mini escort car(s) (L12: two). The Owner-approved L6–L12
  art depicts fleet/city/globe scale compositions without mini escorts, so shipping the
  new bytes under V2 as-is would make the shipped artifact contradict accepted normative
  text.
- Provenance: this record

### OBS-EVO-006 — Base pack structure and invariants

- Subject: `mayf3/vehicle-pet:main` at `aa0a014dfc…`
- Method: read `src/packs/autonomous-fleet/manifest.json`, `scripts/generate-pack-assets.mjs`,
  `scripts/generate-dsh-assets.mjs`, `src/engine/validation/validate-pack.ts`, `tests/unit/fleet-freeze.test.ts`
- Result: 12 level sprites (`sprite-subject-pod--l1…l12`, PNG + lossless WebP twins, 480×480)
  derived deterministically from two committed family masters by measured cut points;
  thresholds 0…2,500,000 frozen; L6–L12 populations vehicles ×3…×1,000,000; 11 keepsakes
  bound to L2–L12; single-asset budget 2,097,152 bytes, pack budget 16,777,216 bytes;
  DSH asset bundle imports the same asset paths (bytes inline at DSH build time).
  The freeze test asserts the exact 12 summary strings.
- Provenance: this record

## Claims

### CLM-EVO-001 — The requested work is a SUPERSEDE, not REUSE — SUPPORTED

EVD-EVO-001: OBS-EVO-004 + OBS-EVO-005 → CLM-EVO-001. The new art is approved and matches
the Owner's frozen scale semantics, but the accepted §11.1 narrative and DEC-PET-031
normatively describe a different visual identity for L6–L12. Under the shared grammar
(§6.3) V0 supports only whole-authority supersession, so the minimal legal action is
CONFIGURABLE_PET_ENGINE_V3 superseding V2 (full copy + DEC-PET-032 + revised §11.1
L6–L12 rows), mirroring the V1→V2 transition. Strength: direct text comparison. Limits:
none for the classification itself; whether V3's wording is honest is the reviewer's call.

### CLM-EVO-002 — Everything else is data/binary swap under unchanged semantics — SUPPORTED

EVD-EVO-002: OBS-EVO-006 → CLM-EVO-002. Asset IDs, paths, dimensions, thresholds, scene
kinds/presets/populations, keepsake count/binding, Engine progression, Token economy, DSH
usage source, and Panel contract can all stay unchanged; only L6–L12 sprite bytes, the
L6–L12 stage/summary/milestone/alt/keepsake copy, and the derivation source of the L6–L12
sprites change. The frozen tests that assert the old summary strings update to the new
accepted truth without weakening any other assertion.

## Decision

Author `CONFIGURABLE_PET_ENGINE_V3` (docs-only) per CLM-EVO-001; implementation is
forbidden on any base that does not contain accepted V3.
